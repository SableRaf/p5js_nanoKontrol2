// MidiController — the reusable generic engine.

import { MIDI_CC_MAX, RAW } from './constants';
import { EASING, durationToSpeed } from './smoothing';
import { StatusBanner } from './StatusBanner';
import type {
  ButtonType,
  ControllerDefinition,
  EasingType,
  GetValueOptions,
  InputControl,
  MidiControllerOptions,
  Range,
  RuntimeType,
  SmoothConfig,
} from './types';

export class MidiController {
  private _def: ControllerDefinition;
  private _debugLogs: boolean;

  private _ccMap: Record<number, InputControl> = {};
  private _nameToCC: Record<string, number> = {};

  /** The last-triggered control, with its metadata. */
  input: InputControl | null = null;
  /** Value of the last-triggered control. */
  value = 0;

  private _values: Record<number, number> = {};
  private _prevValues: Record<number, number> = {};
  private _smoothed: Record<number, number> = {};
  private _rawMode: Record<number, boolean> = {};
  private _rawGlobal = false;

  private _defaultValue: number;
  private _smooth: SmoothConfig = { enabled: false, easingType: 'lerp', duration: 150 };
  private _smoothPerName: Record<string, SmoothConfig> = {};

  /** Per-button runtime type (default 'momentary'); sliders/knobs are excluded. */
  private _buttonType: Record<string, ButtonType> = {};
  /** Latched state for toggle/radio buttons. */
  private _toggled: Record<string, boolean> = {};
  /** Physical held state for buttons. */
  private _pressed: Record<string, boolean> = {};
  /** Radio groups, keyed by each member name → the group's member list. */
  private _radioGroup: Record<string, string[]> = {};
  /** Buttons whose LED has been taken over by an explicit setLed call. */
  private _ledManual: Record<string, boolean> = {};
  /** Per-control custom value ranges (overrides RAW/NORMALIZED). */
  private _range: Record<string, Range> = {};

  /** WebMidi output port for LED control. */
  private _output: any = null;

  private _onReady: (() => void) | undefined;

  /** Optional on-screen connection status banner (enabled via statusLabel). */
  private _statusBanner: StatusBanner | null = null;

  /** Reference to the owning p5 instance (set by the addon factory). */
  _p5: any = null;
  _predrawLogged = false;

  // definition — a controller definition object: { name, controls: [...] }
  // options    — { defaultValue, debugLogs }
  //   defaultValue — normalized 0..1 fallback before any input
  //   debugLogs    — when true, log raw MIDI events to the console
  //   statusLabel  — when true, inject an on-screen connection status banner
  constructor(definition: ControllerDefinition, { defaultValue = 0, debugLogs = false, statusLabel = false, onReady }: MidiControllerOptions = {}) {
    this._def = definition;
    this._debugLogs = debugLogs;
    this._onReady = onReady;
    if (statusLabel) this._statusBanner = new StatusBanner(definition.model);

    // Build CC ↔ name maps from the definition.
    for (const ctrl of definition.controls) {
      const entry: InputControl = {
        name: ctrl.constant,
        type: ctrl.type,
        hasLed: ctrl.hasLed ?? (ctrl.type === 'momentary' || ctrl.type === 'toggle'),
      };
      for (const cc of ctrl.ctrlIndex) {
        this._ccMap[cc] = entry;
      }
      this._nameToCC[ctrl.constant] = ctrl.ctrlIndex[0];
      // Every non-continuous control is a button; default its runtime type to
      // 'momentary' (toggle/radio is opt-in via setType).
      if (ctrl.type !== 'continuous') this._buttonType[ctrl.constant] = 'momentary';
    }

    this._defaultValue = Math.min(Math.max(defaultValue, 0), 1) * MIDI_CC_MAX;

    this._initMidi();
  }

  // --- Public API --------------------------------------------------------

  /** True when a MIDI output port for this device is available. */
  get isConnected(): boolean {
    return this._output !== null;
  }

  /** True if the named control is a button (not a continuous slider/knob). */
  private _isButton(name: string): boolean {
    return this._buttonType[name] !== undefined;
  }

  /**
   * The live runtime type of a control: 'continuous' for sliders/knobs, or the
   * last setType() value for buttons (default 'momentary'). undefined if unknown.
   */
  getType(name: string): RuntimeType | undefined {
    const cc = this._nameToCC[name];
    if (cc === undefined) return undefined;
    return this._buttonType[name] ?? 'continuous';
  }

  /** Whether the named control has a hardware LED. undefined if unknown. */
  hasLed(name: string): boolean | undefined {
    const cc = this._nameToCC[name];
    return cc !== undefined ? this._ccMap[cc].hasLed : undefined;
  }

  /** True while the named button is physically held down. */
  isPressed(name: string): boolean {
    return this._pressed[name] ?? false;
  }

  /** Library-managed latched state for a 'toggle'/'radio' button. */
  isToggled(name: string): boolean {
    return this._toggled[name] ?? false;
  }

  // Change a button's runtime behavior.
  //   setType(MUTE_1, 'toggle')
  //   setType([MUTE_1, MUTE_2], 'toggle')
  //   setType([SOLO_1, SOLO_2, ...], 'radio')  // mutually exclusive group
  // Sliders and knobs are continuous and ignored. 'radio' requires an array of
  // two or more controls; invalid calls warn and are ignored.
  setType(name: string | string[], type: ButtonType): void {
    const names = ([] as string[]).concat(name).filter(n => this._isButton(n));

    if (type === 'radio' && names.length < 2) {
      console.warn("setType: 'radio' requires an array of 2 or more controls; ignoring");
      return;
    }

    for (const n of names) {
      this._buttonType[n] = type;
      if (type === 'radio') {
        this._radioGroup[n] = names;
      } else {
        delete this._radioGroup[n];
      }
      this._applyAutoLed(n);
    }
  }

  // Set the latched state of a 'toggle' or 'radio' button, as if it had been
  // pressed to that state. Useful for seeding an initial selection, e.g. lighting
  // PLAY at startup in a PLAY/STOP radio group.
  //   setToggled(MUTE_1, true)   // latch a toggle on
  //   setToggled(PLAY, true)     // make PLAY the active radio member
  // For a 'radio' button, setting it true activates it and deactivates its peers;
  // setting it false clears the whole group. Momentary buttons and continuous
  // controls are ignored with a warning.
  setToggled(name: string, on: boolean): void {
    const type = this._buttonType[name];
    if (type !== 'toggle' && type !== 'radio') {
      console.warn(`setToggled: '${name}' is not a 'toggle' or 'radio' button; ignoring`);
      return;
    }

    if (type === 'radio') {
      for (const member of this._radioGroup[name] ?? [name]) {
        const wasActive = this._toggled[member] ?? false;
        const nowActive = on && member === name;
        if (wasActive === nowActive) continue;
        this._toggled[member] = nowActive;
        this._applyAutoLed(member);
      }
      return;
    }

    if ((this._toggled[name] ?? false) === on) return;
    this._toggled[name] = on;
    this._applyAutoLed(name);
  }

  // valueMode(RAW)            — set global raw mode
  // valueMode(NORMALIZED)     — set global normalized mode (default)
  // valueMode(KNOB_1, RAW)    — set per-control raw mode
  // A global call clears all custom ranges; a per-control call clears that
  // control's custom range.
  valueMode(a: string, b?: string): void {
    if (b === undefined) {
      // Single argument: global mode toggle. Clears all custom ranges.
      this._rawGlobal = a === RAW;
      this._range = {};
    } else {
      const cc = this._nameToCC[a];
      if (cc !== undefined) {
        this._rawMode[cc] = b === RAW;
        delete this._range[a];
      }
    }
  }

  // Map a control's full travel to a custom min..max range. Overrides the
  // RAW/NORMALIZED mode for that control.
  setRange(name: string, min: number, max: number): void {
    if (this._nameToCC[name] === undefined) return;
    this._range[name] = { min, max };
  }

  // Turn a button LED on (true) or off (false) by control name.
  // Note: external LED control only works when the nanoKONTROL2's LED Mode is
  // set to "External" (via the KORG Kontrol Editor). In the default "Internal"
  // mode the unit drives its own LEDs and ignores these messages.
  // name accepts a single control or an array. An explicit setLed call takes
  // over the button's LED, stopping automatic type-driven behavior for it.
  setLed(name: string | string[], on: boolean): void {
    for (const n of ([] as string[]).concat(name)) {
      this._ledManual[n] = true;
      this._sendLed(n, on);
    }
  }

  // Low-level LED write that does not claim manual ownership — used by both
  // setLed and the automatic type-driven LED behavior.
  private _sendLed(name: string, on: boolean): void {
    if (!this._output) {
      if (this._debugLogs) console.warn(`[nanokontrol2] setLed(${name}): no MIDI output port found`);
      return;
    }
    const cc = this._nameToCC[name];
    if (cc === undefined) {
      if (this._debugLogs) console.warn(`[nanokontrol2] setLed: unknown control "${name}"`);
      return;
    }
    if (this._debugLogs) console.log(`[nanokontrol2] LED  ${name} (cc${cc}) -> ${on ? 'ON' : 'off'}`);
    this._output.sendControlChange(cc, on ? 127 : 0);
  }

  // Drive a button's LED from its runtime type, unless setLed has taken over.
  // No-op for non-LED buttons; only visible in External LED mode.
  private _applyAutoLed(name: string): void {
    if (this._ledManual[name]) return;
    const type = this._buttonType[name];
    if (type === undefined) return; // not a button
    if (this.hasLed(name) !== true) return;

    let on: boolean;
    if (type === 'momentary') on = this._pressed[name] ?? false;
    else on = this._toggled[name] ?? false; // toggle and radio
    this._sendLed(name, on);
  }

  // Turn all button LEDs on or off at once. Unlike setLed, this does not claim
  // manual LED ownership, so type-driven auto-LED resumes on the next press.
  setAllLeds(state: boolean): void {
    for (const name of Object.keys(this._nameToCC)) {
      this._sendLed(name, state);
    }
  }

  // Configure smoothing for one or more controls.
  //   setSmooth(SLIDER_1, 'easeOut', 500)
  //   setSmooth([SLIDER_1, SLIDER_2], 'easeIn', 300)
  //   setSmooth(KNOB_1, false)   — toggle enabled, keeping other settings
  // duration defaults to 150 ms (~time to reach 95% of target at 60 fps).
  setSmooth(name: string | string[], easing: EasingType | boolean, duration?: number): void {
    for (const n of ([] as string[]).concat(name)) {
      if (typeof easing === 'boolean') {
        const base = this._smoothPerName[n] ?? this._smooth;
        this._smoothPerName[n] = { ...base, enabled: easing };
      } else {
        this._smoothPerName[n] = { enabled: true, easingType: easing, duration: duration ?? 150 };
      }
    }
  }

  // Configure smoothing globally for all controls. Per-control setSmooth wins.
  //   smoothMode('easeInOut', 200)
  //   smoothMode(false)   — toggle global enabled, keeping other settings
  smoothMode(easing: EasingType | boolean, duration?: number): void {
    if (typeof easing === 'boolean') {
      this._smooth = { ...this._smooth, enabled: easing };
    } else {
      this._smooth = { enabled: true, easingType: easing, duration: duration ?? 150 };
    }
  }

  // Show or hide the on-screen connection status banner at runtime.
  statusLabel(on: boolean): void {
    if (on) {
      if (!this._statusBanner) this._statusBanner = new StatusBanner(this._def.model);
      if (this.isConnected) this._statusBanner.connected();
      else this._statusBanner.disconnected();
    } else {
      this._statusBanner?.hide();
    }
  }

  // --- Value reading -----------------------------------------------------

  // Returns the effective smooth config for a named control.
  private _smoothFor(name: string): SmoothConfig {
    return this._smoothPerName[name] ?? this._smooth;
  }

  // Read a control's value by name. Returns smoothed value when enabled,
  // normalized to 0..1 unless the control (or global mode) is RAW.
  // Pass { smoothed: false } to read the immediate (target) value, ignoring
  // smoothing — used when dispatching events.
  getValue(name: string, { defaultValue, smoothed = true }: GetValueOptions = {}): number {
    const cc = this._nameToCC[name];
    if (cc === undefined) return 0;

    const fallback = defaultValue !== undefined
      ? Math.min(Math.max(defaultValue, 0), 1) * MIDI_CC_MAX
      : this._defaultValue;

    const smooth = this._smoothFor(name);
    // When smoothing is enabled but the smoothed value hasn't been initialized
    // yet (no predraw tick has run for this control), fall back to the latest
    // raw value rather than the global default so polling never reads stale 0s.
    const raw = (smoothed && smooth.enabled)
      ? (this._smoothed[cc] ?? this._values[cc] ?? fallback)
      : (this._values[cc] ?? fallback);

    const range = this._range[name];
    if (range) {
      // A custom range maps normalized 0..1 → min..max, overriding RAW/NORMALIZED.
      return range.min + (raw / MIDI_CC_MAX) * (range.max - range.min);
    }

    const isRaw = this._rawGlobal || this._rawMode[cc];
    return isRaw ? raw : raw / MIDI_CC_MAX;
  }

  // --- Internal: MIDI event handling -------------------------------------

  // Called by the MIDI event handler. Sets input/value and dispatches
  // the appropriate user callback.
  private _update(cc: number, rawValue: number): void {
    const ctrl = this._ccMap[cc];
    if (!ctrl) return;

    this._prevValues[cc] = this._values[cc];
    this._values[cc] = rawValue;

    this.input = ctrl;

    if (ctrl.type === 'continuous') {
      // Report the immediate target value to the callback. When smoothing is
      // enabled, _interpolate() re-fires controlChanged each frame with the
      // smoothed value until the control settles.
      this.value = this.getValue(ctrl.name, { smoothed: false });
      this._dispatchAction('controlChanged', ctrl.name);
    } else {
      this.value = this.getValue(ctrl.name, { smoothed: false });
      const prev = this._prevValues[cc] ?? 0;
      if (rawValue > 0 && prev === 0) {
        this._pressed[ctrl.name] = true;
        this._onButtonPress(ctrl.name);
        this._applyAutoLed(ctrl.name);
        this._dispatchAction('buttonPressed', ctrl.name);
      } else if (rawValue === 0 && prev > 0) {
        this._pressed[ctrl.name] = false;
        this._applyAutoLed(ctrl.name);
        this._dispatchAction('buttonReleased', ctrl.name);
      }
    }
  }

  // Update library-managed latched state on a button press, per its type.
  private _onButtonPress(name: string): void {
    const type = this._buttonType[name];
    if (type === 'toggle') {
      this._toggled[name] = !this._toggled[name];
    } else if (type === 'radio') {
      for (const member of this._radioGroup[name] ?? [name]) {
        const wasActive = this._toggled[member];
        this._toggled[member] = member === name;
        // Refresh peers' LEDs when their state changed.
        if (member !== name && wasActive) this._applyAutoLed(member);
      }
    }
  }

  // Advance all smoothed values one step toward their targets.
  // Called automatically each frame via the `predraw` lifecycle hook.
  // While a continuous control is still settling, re-fires controlChanged so
  // callback-driven sketch state tracks the smoothed value frame by frame.
  _interpolate(): void {
    for (const [ccKey, ctrl] of Object.entries(this._ccMap)) {
      const cc = Number(ccKey);
      const smooth = this._smoothFor(ctrl.name);
      if (!smooth.enabled) continue;

      const target = this._values[cc] ?? this._defaultValue;
      const current = this._smoothed[cc] ?? this._defaultValue;
      if (Math.abs(target - current) < 1e-3) {
        this._smoothed[cc] = target;
        continue; // settled — nothing to advance or re-dispatch
      }

      const ease = EASING[smooth.easingType] ?? EASING.lerp;
      const t = ease(durationToSpeed(smooth.duration));
      this._smoothed[cc] = current + (target - current) * t;

      // Re-dispatch controlChanged for continuous controls so callbacks that
      // read nano.value keep tracking the smoothed value.
      if (ctrl.type === 'continuous') {
        this.input = ctrl;
        this.value = this.getValue(ctrl.name);
        this._dispatchAction('controlChanged', ctrl.name);
      }
    }
  }

  // --- Internal: WebMidi wiring ------------------------------------------

  private _initMidi(): void {
    if (typeof WebMidi === 'undefined') {
      console.error('p5.nanokontrol2: WebMidi.js not loaded — check the <script> tag');
      return;
    }
    if (typeof navigator.requestMIDIAccess !== 'function') {
      console.warn('p5.nanokontrol2: WebMIDI is not supported in this browser');
      this._statusBanner?.noWebMidi();
      return;
    }
    WebMidi.enable()
      .then(() => this._onEnabled())
      .catch((err: Error) => console.error('p5.nanokontrol2: WebMidi:', err.message));
  }

  private _dispatchAction(
    name: 'deviceConnected' | 'deviceDisconnected' | 'controlChanged' | 'buttonPressed' | 'buttonReleased',
    controlName?: string,
  ): void {
    // Keep the optional status banner in sync with the connection lifecycle.
    if (name === 'deviceConnected') this._statusBanner?.connected();
    else if (name === 'deviceDisconnected') this._statusBanner?.disconnected();

    // Instance mode: the callback is a method on the sketch. Global mode: p5
    // does not copy user functions onto the instance, so they live on window.
    if (typeof this._p5?.[name] === 'function') this._p5[name](controlName);
    else if (typeof (window as any)[name] === 'function') (window as any)[name](controlName);
  }

  private _onEnabled(): void {
    WebMidi.inputs.forEach((input: any) => this._listenTo(input)); // ports at startup
    WebMidi.addListener('connected', (e: any) => {                 // and hot-plugged
      if (e.port.type === 'input') this._listenTo(e.port);
      if (e.port.type === 'output' && e.port.name.includes(this._def.model)) {
        this._output = e.port;
        this._dispatchAction('deviceConnected');
        // Wait for the device's built-in startup flash to finish before running ours.
        setTimeout(() => this._ledStartupSequence(), 1500);
      }
    });
    WebMidi.addListener('disconnected', (e: any) => {
      if (this._debugLogs) console.log(`[nanokontrol2] disconnected: ${e.port.name}`);
      if (e.port.name.includes(this._def.model)) {
        if (e.port.type === 'output') this._output = null;
        this._dispatchAction('deviceDisconnected');
      }
    });

    this._output = WebMidi.outputs.find((o: any) => o.name.includes(this._def.model)) ?? null;

    if (this._output) {
      this._dispatchAction('deviceConnected');
      this._ledStartupSequence().then(() => this._onReady?.());
    } else {
      this._onReady?.();
    }
  }

  private _listenTo(input: any): void {
    input.removeListener();                    // guard against double-binding
    if (this._debugLogs) console.log(`[nanokontrol2] listening: ${input.name}`);
    input.addListener('controlchange', (e: any) => this._onControlChange(e));
    input.addListener('midimessage', (e: any) => this._onOtherMessage(e));
  }

  private _onControlChange(e: any): void {
    if (this._debugLogs) {
      console.log(
        `[nanokontrol2] CC  ch${e.message.channel}  cc${e.controller.number}  val=${e.rawValue}`
      );
    }
    this._update(e.controller.number, e.rawValue); // 0..127
  }

  // Catch-all for notes, sysex, clock, etc. — CCs are handled above.
  private _onOtherMessage(e: any): void {
    if (!this._debugLogs || e.message.type === 'controlchange') return;
    const hex = Array.from(e.message.data as Iterable<number>)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`[nanokontrol2] RAW  ${hex}`);
  }

  // Cycle every button LED on then off, then flash twice — a connect animation.
  private async _ledStartupSequence(): Promise<void> {
    const buttonNames = this._def.controls
      .filter(c => c.type === 'momentary' || c.type === 'toggle')
      .map(c => c.constant);
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Use _sendLed (not the public setLed) so the connect animation does not
    // claim manual LED ownership — otherwise auto type-driven LEDs would be
    // permanently suppressed for every button after startup.
    for (const name of buttonNames) this._sendLed(name, false); // start clean

    for (const name of buttonNames) {
      this._sendLed(name, true);
      await delay(30);
      this._sendLed(name, false);
    }

    await delay(400);

    for (let j = 0; j < 2; j++) {
      for (const name of buttonNames) this._sendLed(name, true);
      await delay(150);
      for (const name of buttonNames) this._sendLed(name, false);
      await delay(100);
    }

    // The sequence above left every LED off. Restore the latched state that
    // setType/setToggled may have established before the device connected, so
    // seeded toggles and radio selections light up once startup finishes.
    this._refreshAutoLeds();
  }

  // Re-send each button's type-driven LED from its current latched state.
  // _applyAutoLed skips buttons whose LED was claimed by an explicit setLed.
  private _refreshAutoLeds(): void {
    for (const name of Object.keys(this._buttonType)) this._applyAutoLed(name);
  }
}
