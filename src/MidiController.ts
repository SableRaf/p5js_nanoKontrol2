// MidiController — the reusable generic engine.

import { MIDI_CC_MAX, RAW } from './constants';
import { EASING, durationToSpeed } from './smoothing';
import type {
  ControllerDefinition,
  GetValueOptions,
  InputControl,
  MidiControllerOptions,
  SetSmoothOptions,
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

  /** WebMidi output port for LED control. */
  private _output: any = null;

  private _onReady: (() => void) | undefined;

  /** Reference to the owning p5 instance (set by the addon factory). */
  _p5: any = null;
  _predrawLogged = false;

  // definition — a controller definition object: { name, controls: [...] }
  // options    — { defaultValue, debugLogs }
  //   defaultValue — normalized 0..1 fallback before any input
  //   debugLogs    — when true, log raw MIDI events to the console
  constructor(definition: ControllerDefinition, { defaultValue = 0, debugLogs = false, onReady }: MidiControllerOptions = {}) {
    this._def = definition;
    this._debugLogs = debugLogs;
    this._onReady = onReady;

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
    }

    this._defaultValue = Math.min(Math.max(defaultValue, 0), 1) * MIDI_CC_MAX;

    this._initMidi();
  }

  // --- Public API --------------------------------------------------------

  /** True when a MIDI output port for this device is available. */
  get isConnected(): boolean {
    return this._output !== null;
  }

  /** Returns the control metadata for a given name, or undefined if unknown. */
  getControl(name: string): InputControl | undefined {
    const cc = this._nameToCC[name];
    return cc !== undefined ? this._ccMap[cc] : undefined;
  }

  // inputMode(RAW)            — set global raw mode
  // inputMode(KNOB_1, RAW)    — set per-control raw mode
  inputMode(a: string, b?: string): void {
    if (b === undefined) {
      // Single argument: global mode toggle.
      this._rawGlobal = a === RAW;
    } else {
      const cc = this._nameToCC[a];
      if (cc !== undefined) this._rawMode[cc] = b === RAW;
    }
  }

  // Turn a button LED on (true) or off (false) by control name.
  // Note: external LED control only works when the nanoKONTROL2's LED Mode is
  // set to "External" (via the KORG Kontrol Editor). In the default "Internal"
  // mode the unit drives its own LEDs and ignores these messages.
  setLed(name: string, on: boolean): void {
    if (!this._output) {
      if (this._debugLogs) console.warn(`[nanokontrol2] setLed(${name}): no MIDI output port found`);
      return;
    }
    const cc = this._nameToCC[name];
    if (cc === undefined) {
      if (this._debugLogs) console.warn(`[nanokontrol2] setLed: unknown control "${name}"`);
      return;
    }
    this._output.sendControlChange(cc, on ? 127 : 0);
  }

  // Configure smoothing globally, or for specific input(s).
  //   inputName  — name string or array of names; omit to set globally
  //   enabled    — true/false (default true)
  //   easingType — 'lerp' | 'easeIn' | 'easeOut' | 'easeInOut' (default 'lerp')
  //   duration   — time in ms to reach ~95% of target (default 150)
  setSmooth({ inputName, enabled = true, easingType = 'lerp', duration = 150 }: SetSmoothOptions = {}): void {
    const config: SmoothConfig = { enabled, easingType, duration };
    if (inputName === undefined) {
      this._smooth = config;
    } else {
      for (const name of ([] as string[]).concat(inputName)) {
        this._smoothPerName[name] = config;
      }
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

    const actions = this._p5 ? this._p5._customActions : null;
    if (!actions) return;

    if (ctrl.type === 'continuous') {
      // Report the immediate target value to the callback. When smoothing is
      // enabled, _interpolate() re-fires inputChanged each frame with the
      // smoothed value until the control settles.
      this.value = this.getValue(ctrl.name, { smoothed: false });
      if (typeof actions.inputChanged === 'function') actions.inputChanged.call(this._p5);
    } else {
      this.value = this.getValue(ctrl.name, { smoothed: false });
      const prev = this._prevValues[cc] ?? 0;
      if (rawValue > 0 && prev === 0) {
        if (typeof actions.buttonPressed === 'function') actions.buttonPressed.call(this._p5);
      } else if (rawValue === 0 && prev > 0) {
        if (typeof actions.buttonReleased === 'function') actions.buttonReleased.call(this._p5);
      }
    }
  }

  // Advance all smoothed values one step toward their targets.
  // Called automatically each frame via the `predraw` lifecycle hook.
  // While a continuous control is still settling, re-fires inputChanged so
  // callback-driven sketch state tracks the smoothed value frame by frame.
  _interpolate(): void {
    const actions = this._p5 ? this._p5._customActions : null;
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

      // Re-dispatch inputChanged for continuous controls so callbacks that
      // read midi.value keep tracking the smoothed value.
      if (ctrl.type === 'continuous' && actions && typeof actions.inputChanged === 'function') {
        this.input = ctrl;
        this.value = this.getValue(ctrl.name);
        actions.inputChanged.call(this._p5);
      }
    }
  }

  // --- Internal: WebMidi wiring ------------------------------------------

  private _initMidi(): void {
    if (typeof WebMidi === 'undefined') {
      console.error('p5.nanokontrol2: WebMidi.js not loaded — check the <script> tag');
      return;
    }
    WebMidi.enable()
      .then(() => this._onEnabled())
      .catch((err: Error) => console.error('p5.nanokontrol2: WebMidi:', err.message));
  }

  private _dispatchAction(name: 'deviceConnected' | 'deviceDisconnected'): void {
    const actions = this._p5 ? this._p5._customActions : null;
    if (actions && typeof actions[name] === 'function') actions[name].call(this._p5);
  }

  private _onEnabled(): void {
    WebMidi.inputs.forEach((input: any) => this._listenTo(input)); // ports at startup
    WebMidi.addListener('connected', (e: any) => {                 // and hot-plugged
      if (e.port.type === 'input') this._listenTo(e.port);
      if (e.port.type === 'output' && e.port.name.includes(this._def.model)) {
        this._output = e.port;
        this._dispatchAction('deviceConnected');
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

    for (const name of buttonNames) this.setLed(name, false); // start clean

    for (const name of buttonNames) {
      this.setLed(name, true);
      await delay(30);
      this.setLed(name, false);
    }

    await delay(400);

    for (let j = 0; j < 2; j++) {
      for (const name of buttonNames) this.setLed(name, true);
      await delay(150);
      for (const name of buttonNames) this.setLed(name, false);
      await delay(100);
    }
  }
}
