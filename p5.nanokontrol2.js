// p5.nanokontrol2.js — a p5.js addon library for the KORG nanoKONTROL2
// (and other MIDI control surfaces) using WebMidi.js v3.
//
// Usage:
//   <script src="https://cdn.jsdelivr.net/npm/webmidi@3/dist/iife/webmidi.iife.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/p5@2.3.0/lib/p5.min.js"></script>
//   <script src="p5.nanokontrol2.js"></script>
//
//   let midi;
//   function setup() { midi = new NanoKontrol2(); }
//   function inputChanged() { if (midi.input === KNOB_1) hue = midi.value * 360; }
//   function buttonPressed() { if (midi.input === PLAY) playing = true; }
//   function buttonReleased() { if (midi.input === REC_1) recording = false; }
//
// See SPECS.md for the full public API.

const MIDI_CC_MAX = 127;

// ---------------------------------------------------------------------------
// Input constants
// ---------------------------------------------------------------------------

// Transport
const CYCLE = 'CYCLE';
const REW = 'REW';
const FF = 'FF';
const STOP = 'STOP';
const PLAY = 'PLAY';
const REC = 'REC';

// Navigation / function buttons
const PREV_TRACK = 'PREV_TRACK';
const NEXT_TRACK = 'NEXT_TRACK';
const SET_MARKER = 'SET_MARKER';
const PREV_MARKER = 'PREV_MARKER';
const NEXT_MARKER = 'NEXT_MARKER';

// Channel controls (×8)
const KNOB_1 = 'KNOB_1', KNOB_2 = 'KNOB_2', KNOB_3 = 'KNOB_3', KNOB_4 = 'KNOB_4';
const KNOB_5 = 'KNOB_5', KNOB_6 = 'KNOB_6', KNOB_7 = 'KNOB_7', KNOB_8 = 'KNOB_8';

const SLIDER_1 = 'SLIDER_1', SLIDER_2 = 'SLIDER_2', SLIDER_3 = 'SLIDER_3', SLIDER_4 = 'SLIDER_4';
const SLIDER_5 = 'SLIDER_5', SLIDER_6 = 'SLIDER_6', SLIDER_7 = 'SLIDER_7', SLIDER_8 = 'SLIDER_8';

const SOLO_1 = 'SOLO_1', SOLO_2 = 'SOLO_2', SOLO_3 = 'SOLO_3', SOLO_4 = 'SOLO_4';
const SOLO_5 = 'SOLO_5', SOLO_6 = 'SOLO_6', SOLO_7 = 'SOLO_7', SOLO_8 = 'SOLO_8';

const MUTE_1 = 'MUTE_1', MUTE_2 = 'MUTE_2', MUTE_3 = 'MUTE_3', MUTE_4 = 'MUTE_4';
const MUTE_5 = 'MUTE_5', MUTE_6 = 'MUTE_6', MUTE_7 = 'MUTE_7', MUTE_8 = 'MUTE_8';

const REC_1 = 'REC_1', REC_2 = 'REC_2', REC_3 = 'REC_3', REC_4 = 'REC_4';
const REC_5 = 'REC_5', REC_6 = 'REC_6', REC_7 = 'REC_7', REC_8 = 'REC_8';

// Input mode
const RAW = 'RAW';

// Collected for bulk exposure on `fn`.
const CONSTANTS = {
  CYCLE, REW, FF, STOP, PLAY, REC,
  PREV_TRACK, NEXT_TRACK, SET_MARKER, PREV_MARKER, NEXT_MARKER,
  KNOB_1, KNOB_2, KNOB_3, KNOB_4, KNOB_5, KNOB_6, KNOB_7, KNOB_8,
  SLIDER_1, SLIDER_2, SLIDER_3, SLIDER_4, SLIDER_5, SLIDER_6, SLIDER_7, SLIDER_8,
  SOLO_1, SOLO_2, SOLO_3, SOLO_4, SOLO_5, SOLO_6, SOLO_7, SOLO_8,
  MUTE_1, MUTE_2, MUTE_3, MUTE_4, MUTE_5, MUTE_6, MUTE_7, MUTE_8,
  REC_1, REC_2, REC_3, REC_4, REC_5, REC_6, REC_7, REC_8,
  RAW,
};

// ---------------------------------------------------------------------------
// Controller definition object
// ---------------------------------------------------------------------------
// All device-specific knowledge lives here. To support a different controller,
// define a new object of the same shape and pass it to `new MidiController(def)`.

const NANOKONTROL2_DEF = {
  name: 'nanoKONTROL2', // matched against WebMidi port names
  controls: [
    // Sliders (CC 0..7)
    { cc: 0, name: SLIDER_1, type: 'continuous' },
    { cc: 1, name: SLIDER_2, type: 'continuous' },
    { cc: 2, name: SLIDER_3, type: 'continuous' },
    { cc: 3, name: SLIDER_4, type: 'continuous' },
    { cc: 4, name: SLIDER_5, type: 'continuous' },
    { cc: 5, name: SLIDER_6, type: 'continuous' },
    { cc: 6, name: SLIDER_7, type: 'continuous' },
    { cc: 7, name: SLIDER_8, type: 'continuous' },
    // Knobs (CC 16..23)
    { cc: 16, name: KNOB_1, type: 'continuous' },
    { cc: 17, name: KNOB_2, type: 'continuous' },
    { cc: 18, name: KNOB_3, type: 'continuous' },
    { cc: 19, name: KNOB_4, type: 'continuous' },
    { cc: 20, name: KNOB_5, type: 'continuous' },
    { cc: 21, name: KNOB_6, type: 'continuous' },
    { cc: 22, name: KNOB_7, type: 'continuous' },
    { cc: 23, name: KNOB_8, type: 'continuous' },
    // Solo (CC 32..39)
    { cc: 32, name: SOLO_1, type: 'button' },
    { cc: 33, name: SOLO_2, type: 'button' },
    { cc: 34, name: SOLO_3, type: 'button' },
    { cc: 35, name: SOLO_4, type: 'button' },
    { cc: 36, name: SOLO_5, type: 'button' },
    { cc: 37, name: SOLO_6, type: 'button' },
    { cc: 38, name: SOLO_7, type: 'button' },
    { cc: 39, name: SOLO_8, type: 'button' },
    // Mute (CC 48..55)
    { cc: 48, name: MUTE_1, type: 'button' },
    { cc: 49, name: MUTE_2, type: 'button' },
    { cc: 50, name: MUTE_3, type: 'button' },
    { cc: 51, name: MUTE_4, type: 'button' },
    { cc: 52, name: MUTE_5, type: 'button' },
    { cc: 53, name: MUTE_6, type: 'button' },
    { cc: 54, name: MUTE_7, type: 'button' },
    { cc: 55, name: MUTE_8, type: 'button' },
    // Rec (CC 64..71)
    { cc: 64, name: REC_1, type: 'button' },
    { cc: 65, name: REC_2, type: 'button' },
    { cc: 66, name: REC_3, type: 'button' },
    { cc: 67, name: REC_4, type: 'button' },
    { cc: 68, name: REC_5, type: 'button' },
    { cc: 69, name: REC_6, type: 'button' },
    { cc: 70, name: REC_7, type: 'button' },
    { cc: 71, name: REC_8, type: 'button' },
    // Transport
    { cc: 41, name: PLAY, type: 'button' },
    { cc: 42, name: STOP, type: 'button' },
    { cc: 43, name: REW, type: 'button' },
    { cc: 44, name: FF, type: 'button' },
    { cc: 45, name: REC, type: 'button' },
    { cc: 46, name: CYCLE, type: 'button' },
    // Navigation
    { cc: 58, name: PREV_TRACK, type: 'button' },
    { cc: 59, name: NEXT_TRACK, type: 'button' },
    { cc: 60, name: SET_MARKER, type: 'button' },
    { cc: 61, name: PREV_MARKER, type: 'button' },
    { cc: 62, name: NEXT_MARKER, type: 'button' },
  ],
};

// ---------------------------------------------------------------------------
// Smoothing helpers
// ---------------------------------------------------------------------------

// Easing functions — receive the raw speed/blend factor t (0..1).
const EASING = {
  lerp: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

// Convert a duration in ms to a per-frame blend factor assuming 60 fps.
// A shorter duration → larger t → faster convergence.
function durationToSpeed(ms) {
  const frames = Math.max(1, (ms / 1000) * 60);
  return 1 - Math.pow(0.05, 1 / frames);
}

// ---------------------------------------------------------------------------
// MidiController — the reusable generic engine
// ---------------------------------------------------------------------------

class MidiController {
  // definition — a controller definition object: { name, controls: [...] }
  // options    — { defaultValue, debugLogs }
  //   defaultValue — normalized 0..1 fallback before any input
  //   debugLogs    — when true, log raw MIDI events to the console
  constructor(definition, { defaultValue = 0, debugLogs = false } = {}) {
    this._def = definition;
    this._debugLogs = debugLogs;

    // Build CC ↔ name maps from the definition.
    this._ccMap = {};     // cc → { name, type }
    this._nameToCC = {};  // name → cc
    for (const ctrl of definition.controls) {
      this._ccMap[ctrl.cc] = { name: ctrl.name, type: ctrl.type };
      this._nameToCC[ctrl.name] = ctrl.cc;
    }

    // State
    this.input = null;    // constant of the last-triggered control
    this.value = 0;       // value of the last-triggered control

    this._values = {};     // cc → last raw value (0..127)
    this._prevValues = {}; // cc → previous raw value (transition detection)
    this._smoothed = {};   // cc → smoothed raw value (0..127)
    this._rawMode = {};    // cc → true when this control reports raw values
    this._rawGlobal = false;

    this._defaultValue = Math.min(Math.max(defaultValue, 0), 1) * MIDI_CC_MAX;
    this._smooth = { enabled: false, easingType: 'lerp', duration: 150 };
    this._smoothPerName = {}; // name → smooth config override

    // WebMidi output port for LED control.
    this._output = null;

    // Reference to the owning p5 instance (set by the addon factory).
    this._p5 = null;

    this._initMidi();
  }

  // --- Public API --------------------------------------------------------

  // inputMode(RAW)            — set global raw mode
  // inputMode(KNOB_1, RAW)    — set per-control raw mode
  inputMode(a, b) {
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
  setLed(name, on) {
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
  setSmooth({ inputName, enabled = true, easingType = 'lerp', duration = 150 } = {}) {
    const config = { enabled, easingType, duration };
    if (inputName === undefined) {
      this._smooth = config;
    } else {
      for (const name of [].concat(inputName)) {
        this._smoothPerName[name] = config;
      }
    }
  }

  // --- Value reading -----------------------------------------------------

  // Returns the effective smooth config for a named control.
  _smoothFor(name) {
    return this._smoothPerName[name] ?? this._smooth;
  }

  // Read a control's value by name. Returns smoothed value when enabled,
  // normalized to 0..1 unless the control (or global mode) is RAW.
  // Pass { smoothed: false } to read the immediate (target) value, ignoring
  // smoothing — used when dispatching events.
  getValue(name, { defaultValue, smoothed = true } = {}) {
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
  _update(cc, rawValue) {
    const ctrl = this._ccMap[cc];
    if (!ctrl) return;

    this._prevValues[cc] = this._values[cc];
    this._values[cc] = rawValue;

    this.input = ctrl.name;

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
  _interpolate() {
    const actions = this._p5 ? this._p5._customActions : null;
    for (const [cc, ctrl] of Object.entries(this._ccMap)) {
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
        this.input = ctrl.name;
        this.value = this.getValue(ctrl.name);
        actions.inputChanged.call(this._p5);
      }
    }
  }

  // --- Internal: WebMidi wiring ------------------------------------------

  _initMidi() {
    if (typeof WebMidi === 'undefined') {
      console.error('p5.nanokontrol2: WebMidi.js not loaded — check the <script> tag');
      return;
    }
    WebMidi.enable()
      .then(() => this._onEnabled())
      .catch(err => console.error('p5.nanokontrol2: WebMidi:', err.message));
  }

  _onEnabled() {
    WebMidi.inputs.forEach(input => this._listenTo(input)); // ports at startup
    WebMidi.addListener('connected', e => {                 // and hot-plugged
      if (e.port.type === 'input') this._listenTo(e.port);
      if (e.port.type === 'output' && e.port.name.includes(this._def.name)) {
        this._output = e.port;
      }
    });
    WebMidi.addListener('disconnected', e => {
      if (this._debugLogs) console.log(`[nanokontrol2] disconnected: ${e.port.name}`);
    });

    this._output = WebMidi.outputs.find(o => o.name.includes(this._def.name)) ?? null;

    if (this._output) this._ledStartupSequence();
  }

  _listenTo(input) {
    input.removeListener();                    // guard against double-binding
    if (this._debugLogs) console.log(`[nanokontrol2] listening: ${input.name}`);
    input.addListener('controlchange', e => this._onControlChange(e));
    input.addListener('midimessage', e => this._onOtherMessage(e));
  }

  _onControlChange(e) {
    if (this._debugLogs) {
      console.log(
        `[nanokontrol2] CC  ch${e.message.channel}  cc${e.controller.number}  val=${e.rawValue}`
      );
    }
    this._update(e.controller.number, e.rawValue); // 0..127
  }

  // Catch-all for notes, sysex, clock, etc. — CCs are handled above.
  _onOtherMessage(e) {
    if (!this._debugLogs || e.message.type === 'controlchange') return;
    const hex = Array.from(e.message.data)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`[nanokontrol2] RAW  ${hex}`);
  }

  // Cycle every button LED on then off, then flash twice — a connect animation.
  async _ledStartupSequence() {
    const buttonNames = this._def.controls
      .filter(c => c.type === 'button')
      .map(c => c.name);
    const delay = ms => new Promise(r => setTimeout(r, ms));

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

// ---------------------------------------------------------------------------
// Addon registration
// ---------------------------------------------------------------------------

function nanoKontrol2Addon(p5, fn, lifecycles) {
  // Expose input/mode constants as p5 globals.
  for (const [key, val] of Object.entries(CONSTANTS)) {
    fn[key] = val;
  }

  // Expose the generic engine for power users defining custom controllers.
  fn.MidiController = MidiController;

  // Device-specific class. We must store state on the live p5 instance so the
  // controller can reach `_customActions` and `predraw` can find the controller.
  // In global mode `this` is `window` (p5 calls setup() as window.setup()), not
  // the p5 instance — so fall back to the static `p5.instance` in that case.
  // options — { debugLogs } to log raw MIDI events to the console.
  fn.NanoKontrol2 = function (options = {}) {
    const sketch = (this instanceof p5) ? this : p5.instance;
    const controller = new MidiController(NANOKONTROL2_DEF, options);
    controller._p5 = sketch;
    sketch._nanoKontrol2Instance = controller;
    return controller;
  };

  // Advance smoothing once per frame, before the user's draw() runs.
  lifecycles.predraw = function () {
    const instance = this._nanoKontrol2Instance;
    if (!instance) return;
    if (instance._debugLogs && !instance._predrawLogged) {
      instance._predrawLogged = true;
      console.log('[nanokontrol2] predraw hook is running — smoothing active');
    }
    instance._interpolate();
  };
}

if (typeof p5 !== 'undefined') {
  p5.registerAddon(nanoKontrol2Addon);
}
