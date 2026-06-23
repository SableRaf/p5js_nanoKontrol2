(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["p5nanokontrol2"] = factory();
	else
		root["p5nanokontrol2"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/MidiController.ts"
/*!*******************************!*\
  !*** ./src/MidiController.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MidiController: () => (/* binding */ MidiController)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./src/constants.ts");
/* harmony import */ var _smoothing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./smoothing */ "./src/smoothing.ts");
// MidiController — the reusable generic engine.


class MidiController {
    // definition — a controller definition object: { name, controls: [...] }
    // options    — { defaultValue, debugLogs }
    //   defaultValue — normalized 0..1 fallback before any input
    //   debugLogs    — when true, log raw MIDI events to the console
    constructor(definition, { defaultValue = 0, debugLogs = false } = {}) {
        this._ccMap = {};
        this._nameToCC = {};
        /** Constant of the last-triggered control. */
        this.input = null;
        /** Value of the last-triggered control. */
        this.value = 0;
        this._values = {};
        this._prevValues = {};
        this._smoothed = {};
        this._rawMode = {};
        this._rawGlobal = false;
        this._smooth = { enabled: false, easingType: 'lerp', duration: 150 };
        this._smoothPerName = {};
        /** WebMidi output port for LED control. */
        this._output = null;
        /** Reference to the owning p5 instance (set by the addon factory). */
        this._p5 = null;
        this._predrawLogged = false;
        this._def = definition;
        this._debugLogs = debugLogs;
        // Build CC ↔ name maps from the definition.
        for (const ctrl of definition.controls) {
            this._ccMap[ctrl.cc] = { name: ctrl.name, type: ctrl.type };
            this._nameToCC[ctrl.name] = ctrl.cc;
        }
        this._defaultValue = Math.min(Math.max(defaultValue, 0), 1) * _constants__WEBPACK_IMPORTED_MODULE_0__.MIDI_CC_MAX;
        this._initMidi();
    }
    // --- Public API --------------------------------------------------------
    // inputMode(RAW)            — set global raw mode
    // inputMode(KNOB_1, RAW)    — set per-control raw mode
    inputMode(a, b) {
        if (b === undefined) {
            // Single argument: global mode toggle.
            this._rawGlobal = a === _constants__WEBPACK_IMPORTED_MODULE_0__.RAW;
        }
        else {
            const cc = this._nameToCC[a];
            if (cc !== undefined)
                this._rawMode[cc] = b === _constants__WEBPACK_IMPORTED_MODULE_0__.RAW;
        }
    }
    // Turn a button LED on (true) or off (false) by control name.
    // Note: external LED control only works when the nanoKONTROL2's LED Mode is
    // set to "External" (via the KORG Kontrol Editor). In the default "Internal"
    // mode the unit drives its own LEDs and ignores these messages.
    setLed(name, on) {
        if (!this._output) {
            if (this._debugLogs)
                console.warn(`[nanokontrol2] setLed(${name}): no MIDI output port found`);
            return;
        }
        const cc = this._nameToCC[name];
        if (cc === undefined) {
            if (this._debugLogs)
                console.warn(`[nanokontrol2] setLed: unknown control "${name}"`);
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
        }
        else {
            for (const name of [].concat(inputName)) {
                this._smoothPerName[name] = config;
            }
        }
    }
    // --- Value reading -----------------------------------------------------
    // Returns the effective smooth config for a named control.
    _smoothFor(name) {
        var _a;
        return (_a = this._smoothPerName[name]) !== null && _a !== void 0 ? _a : this._smooth;
    }
    // Read a control's value by name. Returns smoothed value when enabled,
    // normalized to 0..1 unless the control (or global mode) is RAW.
    // Pass { smoothed: false } to read the immediate (target) value, ignoring
    // smoothing — used when dispatching events.
    getValue(name, { defaultValue, smoothed = true } = {}) {
        var _a, _b, _c;
        const cc = this._nameToCC[name];
        if (cc === undefined)
            return 0;
        const fallback = defaultValue !== undefined
            ? Math.min(Math.max(defaultValue, 0), 1) * _constants__WEBPACK_IMPORTED_MODULE_0__.MIDI_CC_MAX
            : this._defaultValue;
        const smooth = this._smoothFor(name);
        // When smoothing is enabled but the smoothed value hasn't been initialized
        // yet (no predraw tick has run for this control), fall back to the latest
        // raw value rather than the global default so polling never reads stale 0s.
        const raw = (smoothed && smooth.enabled)
            ? ((_b = (_a = this._smoothed[cc]) !== null && _a !== void 0 ? _a : this._values[cc]) !== null && _b !== void 0 ? _b : fallback)
            : ((_c = this._values[cc]) !== null && _c !== void 0 ? _c : fallback);
        const isRaw = this._rawGlobal || this._rawMode[cc];
        return isRaw ? raw : raw / _constants__WEBPACK_IMPORTED_MODULE_0__.MIDI_CC_MAX;
    }
    // --- Internal: MIDI event handling -------------------------------------
    // Called by the MIDI event handler. Sets input/value and dispatches
    // the appropriate user callback.
    _update(cc, rawValue) {
        var _a;
        const ctrl = this._ccMap[cc];
        if (!ctrl)
            return;
        this._prevValues[cc] = this._values[cc];
        this._values[cc] = rawValue;
        this.input = ctrl.name;
        const actions = this._p5 ? this._p5._customActions : null;
        if (!actions)
            return;
        if (ctrl.type === 'continuous') {
            // Report the immediate target value to the callback. When smoothing is
            // enabled, _interpolate() re-fires inputChanged each frame with the
            // smoothed value until the control settles.
            this.value = this.getValue(ctrl.name, { smoothed: false });
            if (typeof actions.inputChanged === 'function')
                actions.inputChanged.call(this._p5);
        }
        else {
            this.value = this.getValue(ctrl.name, { smoothed: false });
            const prev = (_a = this._prevValues[cc]) !== null && _a !== void 0 ? _a : 0;
            if (rawValue > 0 && prev === 0) {
                if (typeof actions.buttonPressed === 'function')
                    actions.buttonPressed.call(this._p5);
            }
            else if (rawValue === 0 && prev > 0) {
                if (typeof actions.buttonReleased === 'function')
                    actions.buttonReleased.call(this._p5);
            }
        }
    }
    // Advance all smoothed values one step toward their targets.
    // Called automatically each frame via the `predraw` lifecycle hook.
    // While a continuous control is still settling, re-fires inputChanged so
    // callback-driven sketch state tracks the smoothed value frame by frame.
    _interpolate() {
        var _a, _b, _c;
        const actions = this._p5 ? this._p5._customActions : null;
        for (const [ccKey, ctrl] of Object.entries(this._ccMap)) {
            const cc = Number(ccKey);
            const smooth = this._smoothFor(ctrl.name);
            if (!smooth.enabled)
                continue;
            const target = (_a = this._values[cc]) !== null && _a !== void 0 ? _a : this._defaultValue;
            const current = (_b = this._smoothed[cc]) !== null && _b !== void 0 ? _b : this._defaultValue;
            if (Math.abs(target - current) < 1e-3) {
                this._smoothed[cc] = target;
                continue; // settled — nothing to advance or re-dispatch
            }
            const ease = (_c = _smoothing__WEBPACK_IMPORTED_MODULE_1__.EASING[smooth.easingType]) !== null && _c !== void 0 ? _c : _smoothing__WEBPACK_IMPORTED_MODULE_1__.EASING.lerp;
            const t = ease((0,_smoothing__WEBPACK_IMPORTED_MODULE_1__.durationToSpeed)(smooth.duration));
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
            .catch((err) => console.error('p5.nanokontrol2: WebMidi:', err.message));
    }
    _onEnabled() {
        var _a;
        WebMidi.inputs.forEach((input) => this._listenTo(input)); // ports at startup
        WebMidi.addListener('connected', (e) => {
            if (e.port.type === 'input')
                this._listenTo(e.port);
            if (e.port.type === 'output' && e.port.name.includes(this._def.name)) {
                this._output = e.port;
            }
        });
        WebMidi.addListener('disconnected', (e) => {
            if (this._debugLogs)
                console.log(`[nanokontrol2] disconnected: ${e.port.name}`);
        });
        this._output = (_a = WebMidi.outputs.find((o) => o.name.includes(this._def.name))) !== null && _a !== void 0 ? _a : null;
        if (this._output)
            this._ledStartupSequence();
    }
    _listenTo(input) {
        input.removeListener(); // guard against double-binding
        if (this._debugLogs)
            console.log(`[nanokontrol2] listening: ${input.name}`);
        input.addListener('controlchange', (e) => this._onControlChange(e));
        input.addListener('midimessage', (e) => this._onOtherMessage(e));
    }
    _onControlChange(e) {
        if (this._debugLogs) {
            console.log(`[nanokontrol2] CC  ch${e.message.channel}  cc${e.controller.number}  val=${e.rawValue}`);
        }
        this._update(e.controller.number, e.rawValue); // 0..127
    }
    // Catch-all for notes, sysex, clock, etc. — CCs are handled above.
    _onOtherMessage(e) {
        if (!this._debugLogs || e.message.type === 'controlchange')
            return;
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
        const delay = (ms) => new Promise(r => setTimeout(r, ms));
        for (const name of buttonNames)
            this.setLed(name, false); // start clean
        for (const name of buttonNames) {
            this.setLed(name, true);
            await delay(30);
            this.setLed(name, false);
        }
        await delay(400);
        for (let j = 0; j < 2; j++) {
            for (const name of buttonNames)
                this.setLed(name, true);
            await delay(150);
            for (const name of buttonNames)
                this.setLed(name, false);
            await delay(100);
        }
    }
}


/***/ },

/***/ "./src/addon.ts"
/*!**********************!*\
  !*** ./src/addon.ts ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   nanoKontrol2Addon: () => (/* binding */ nanoKontrol2Addon)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./src/constants.ts");
/* harmony import */ var _MidiController__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./MidiController */ "./src/MidiController.ts");
/* harmony import */ var _definitions_nanokontrol2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./definitions/nanokontrol2 */ "./src/definitions/nanokontrol2.ts");
// p5 addon registration.



function nanoKontrol2Addon(p5, fn, lifecycles) {
    // Expose input/mode constants as p5 globals.
    for (const [key, val] of Object.entries(_constants__WEBPACK_IMPORTED_MODULE_0__.CONSTANTS)) {
        fn[key] = val;
    }
    // Expose the generic engine for power users defining custom controllers.
    fn.MidiController = _MidiController__WEBPACK_IMPORTED_MODULE_1__.MidiController;
    // Device-specific class. We must store state on the live p5 instance so the
    // controller can reach `_customActions` and `predraw` can find the controller.
    // In global mode `this` is `window` (p5 calls setup() as window.setup()), not
    // the p5 instance — so fall back to the static `p5.instance` in that case.
    // options — { debugLogs } to log raw MIDI events to the console.
    fn.NanoKontrol2 = function (options = {}) {
        const sketch = (this instanceof p5) ? this : p5.instance;
        const controller = new _MidiController__WEBPACK_IMPORTED_MODULE_1__.MidiController(_definitions_nanokontrol2__WEBPACK_IMPORTED_MODULE_2__.NANOKONTROL2_DEF, options);
        controller._p5 = sketch;
        sketch._nanoKontrol2Instance = controller;
        return controller;
    };
    // Advance smoothing once per frame, before the user's draw() runs.
    lifecycles.predraw = function () {
        const instance = this._nanoKontrol2Instance;
        if (!instance)
            return;
        if (instance._debugLogs && !instance._predrawLogged) {
            instance._predrawLogged = true;
            console.log('[nanokontrol2] predraw hook is running — smoothing active');
        }
        instance._interpolate();
    };
}


/***/ },

/***/ "./src/constants.ts"
/*!**************************!*\
  !*** ./src/constants.ts ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONSTANTS: () => (/* binding */ CONSTANTS),
/* harmony export */   CYCLE: () => (/* binding */ CYCLE),
/* harmony export */   FF: () => (/* binding */ FF),
/* harmony export */   KNOB_1: () => (/* binding */ KNOB_1),
/* harmony export */   KNOB_2: () => (/* binding */ KNOB_2),
/* harmony export */   KNOB_3: () => (/* binding */ KNOB_3),
/* harmony export */   KNOB_4: () => (/* binding */ KNOB_4),
/* harmony export */   KNOB_5: () => (/* binding */ KNOB_5),
/* harmony export */   KNOB_6: () => (/* binding */ KNOB_6),
/* harmony export */   KNOB_7: () => (/* binding */ KNOB_7),
/* harmony export */   KNOB_8: () => (/* binding */ KNOB_8),
/* harmony export */   MIDI_CC_MAX: () => (/* binding */ MIDI_CC_MAX),
/* harmony export */   MUTE_1: () => (/* binding */ MUTE_1),
/* harmony export */   MUTE_2: () => (/* binding */ MUTE_2),
/* harmony export */   MUTE_3: () => (/* binding */ MUTE_3),
/* harmony export */   MUTE_4: () => (/* binding */ MUTE_4),
/* harmony export */   MUTE_5: () => (/* binding */ MUTE_5),
/* harmony export */   MUTE_6: () => (/* binding */ MUTE_6),
/* harmony export */   MUTE_7: () => (/* binding */ MUTE_7),
/* harmony export */   MUTE_8: () => (/* binding */ MUTE_8),
/* harmony export */   NEXT_MARKER: () => (/* binding */ NEXT_MARKER),
/* harmony export */   NEXT_TRACK: () => (/* binding */ NEXT_TRACK),
/* harmony export */   PLAY: () => (/* binding */ PLAY),
/* harmony export */   PREV_MARKER: () => (/* binding */ PREV_MARKER),
/* harmony export */   PREV_TRACK: () => (/* binding */ PREV_TRACK),
/* harmony export */   RAW: () => (/* binding */ RAW),
/* harmony export */   REC: () => (/* binding */ REC),
/* harmony export */   REC_1: () => (/* binding */ REC_1),
/* harmony export */   REC_2: () => (/* binding */ REC_2),
/* harmony export */   REC_3: () => (/* binding */ REC_3),
/* harmony export */   REC_4: () => (/* binding */ REC_4),
/* harmony export */   REC_5: () => (/* binding */ REC_5),
/* harmony export */   REC_6: () => (/* binding */ REC_6),
/* harmony export */   REC_7: () => (/* binding */ REC_7),
/* harmony export */   REC_8: () => (/* binding */ REC_8),
/* harmony export */   REW: () => (/* binding */ REW),
/* harmony export */   SET_MARKER: () => (/* binding */ SET_MARKER),
/* harmony export */   SLIDER_1: () => (/* binding */ SLIDER_1),
/* harmony export */   SLIDER_2: () => (/* binding */ SLIDER_2),
/* harmony export */   SLIDER_3: () => (/* binding */ SLIDER_3),
/* harmony export */   SLIDER_4: () => (/* binding */ SLIDER_4),
/* harmony export */   SLIDER_5: () => (/* binding */ SLIDER_5),
/* harmony export */   SLIDER_6: () => (/* binding */ SLIDER_6),
/* harmony export */   SLIDER_7: () => (/* binding */ SLIDER_7),
/* harmony export */   SLIDER_8: () => (/* binding */ SLIDER_8),
/* harmony export */   SOLO_1: () => (/* binding */ SOLO_1),
/* harmony export */   SOLO_2: () => (/* binding */ SOLO_2),
/* harmony export */   SOLO_3: () => (/* binding */ SOLO_3),
/* harmony export */   SOLO_4: () => (/* binding */ SOLO_4),
/* harmony export */   SOLO_5: () => (/* binding */ SOLO_5),
/* harmony export */   SOLO_6: () => (/* binding */ SOLO_6),
/* harmony export */   SOLO_7: () => (/* binding */ SOLO_7),
/* harmony export */   SOLO_8: () => (/* binding */ SOLO_8),
/* harmony export */   STOP: () => (/* binding */ STOP)
/* harmony export */ });
// Input constants exposed as p5 globals.
const MIDI_CC_MAX = 127;
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


/***/ },

/***/ "./src/definitions/nanokontrol2.ts"
/*!*****************************************!*\
  !*** ./src/definitions/nanokontrol2.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NANOKONTROL2_DEF: () => (/* binding */ NANOKONTROL2_DEF)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../constants */ "./src/constants.ts");
// nanoKONTROL2 controller definition.
// All device-specific knowledge lives here. To support a different controller,
// define a new object of the same shape and pass it to `new MidiController(def)`.

const NANOKONTROL2_DEF = {
    name: 'nanoKONTROL2', // matched against WebMidi port names
    controls: [
        // Sliders (CC 0..7)
        { cc: 0, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SLIDER_1, type: 'continuous' },
        { cc: 1, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SLIDER_2, type: 'continuous' },
        { cc: 2, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SLIDER_3, type: 'continuous' },
        { cc: 3, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SLIDER_4, type: 'continuous' },
        { cc: 4, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SLIDER_5, type: 'continuous' },
        { cc: 5, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SLIDER_6, type: 'continuous' },
        { cc: 6, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SLIDER_7, type: 'continuous' },
        { cc: 7, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SLIDER_8, type: 'continuous' },
        // Knobs (CC 16..23)
        { cc: 16, name: _constants__WEBPACK_IMPORTED_MODULE_0__.KNOB_1, type: 'continuous' },
        { cc: 17, name: _constants__WEBPACK_IMPORTED_MODULE_0__.KNOB_2, type: 'continuous' },
        { cc: 18, name: _constants__WEBPACK_IMPORTED_MODULE_0__.KNOB_3, type: 'continuous' },
        { cc: 19, name: _constants__WEBPACK_IMPORTED_MODULE_0__.KNOB_4, type: 'continuous' },
        { cc: 20, name: _constants__WEBPACK_IMPORTED_MODULE_0__.KNOB_5, type: 'continuous' },
        { cc: 21, name: _constants__WEBPACK_IMPORTED_MODULE_0__.KNOB_6, type: 'continuous' },
        { cc: 22, name: _constants__WEBPACK_IMPORTED_MODULE_0__.KNOB_7, type: 'continuous' },
        { cc: 23, name: _constants__WEBPACK_IMPORTED_MODULE_0__.KNOB_8, type: 'continuous' },
        // Solo (CC 32..39)
        { cc: 32, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SOLO_1, type: 'button' },
        { cc: 33, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SOLO_2, type: 'button' },
        { cc: 34, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SOLO_3, type: 'button' },
        { cc: 35, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SOLO_4, type: 'button' },
        { cc: 36, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SOLO_5, type: 'button' },
        { cc: 37, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SOLO_6, type: 'button' },
        { cc: 38, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SOLO_7, type: 'button' },
        { cc: 39, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SOLO_8, type: 'button' },
        // Mute (CC 48..55)
        { cc: 48, name: _constants__WEBPACK_IMPORTED_MODULE_0__.MUTE_1, type: 'button' },
        { cc: 49, name: _constants__WEBPACK_IMPORTED_MODULE_0__.MUTE_2, type: 'button' },
        { cc: 50, name: _constants__WEBPACK_IMPORTED_MODULE_0__.MUTE_3, type: 'button' },
        { cc: 51, name: _constants__WEBPACK_IMPORTED_MODULE_0__.MUTE_4, type: 'button' },
        { cc: 52, name: _constants__WEBPACK_IMPORTED_MODULE_0__.MUTE_5, type: 'button' },
        { cc: 53, name: _constants__WEBPACK_IMPORTED_MODULE_0__.MUTE_6, type: 'button' },
        { cc: 54, name: _constants__WEBPACK_IMPORTED_MODULE_0__.MUTE_7, type: 'button' },
        { cc: 55, name: _constants__WEBPACK_IMPORTED_MODULE_0__.MUTE_8, type: 'button' },
        // Rec (CC 64..71)
        { cc: 64, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC_1, type: 'button' },
        { cc: 65, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC_2, type: 'button' },
        { cc: 66, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC_3, type: 'button' },
        { cc: 67, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC_4, type: 'button' },
        { cc: 68, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC_5, type: 'button' },
        { cc: 69, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC_6, type: 'button' },
        { cc: 70, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC_7, type: 'button' },
        { cc: 71, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC_8, type: 'button' },
        // Transport
        { cc: 41, name: _constants__WEBPACK_IMPORTED_MODULE_0__.PLAY, type: 'button' },
        { cc: 42, name: _constants__WEBPACK_IMPORTED_MODULE_0__.STOP, type: 'button' },
        { cc: 43, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REW, type: 'button' },
        { cc: 44, name: _constants__WEBPACK_IMPORTED_MODULE_0__.FF, type: 'button' },
        { cc: 45, name: _constants__WEBPACK_IMPORTED_MODULE_0__.REC, type: 'button' },
        { cc: 46, name: _constants__WEBPACK_IMPORTED_MODULE_0__.CYCLE, type: 'button' },
        // Navigation
        { cc: 58, name: _constants__WEBPACK_IMPORTED_MODULE_0__.PREV_TRACK, type: 'button' },
        { cc: 59, name: _constants__WEBPACK_IMPORTED_MODULE_0__.NEXT_TRACK, type: 'button' },
        { cc: 60, name: _constants__WEBPACK_IMPORTED_MODULE_0__.SET_MARKER, type: 'button' },
        { cc: 61, name: _constants__WEBPACK_IMPORTED_MODULE_0__.PREV_MARKER, type: 'button' },
        { cc: 62, name: _constants__WEBPACK_IMPORTED_MODULE_0__.NEXT_MARKER, type: 'button' },
    ],
};


/***/ },

/***/ "./src/smoothing.ts"
/*!**************************!*\
  !*** ./src/smoothing.ts ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EASING: () => (/* binding */ EASING),
/* harmony export */   durationToSpeed: () => (/* binding */ durationToSpeed)
/* harmony export */ });
// Smoothing helpers.
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


/***/ },

/***/ "./src/types.ts"
/*!**********************!*\
  !*** ./src/types.ts ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// Shared types for the p5.nanokontrol2 library.



/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONSTANTS: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.CONSTANTS),
/* harmony export */   CYCLE: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.CYCLE),
/* harmony export */   FF: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.FF),
/* harmony export */   KNOB_1: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.KNOB_1),
/* harmony export */   KNOB_2: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.KNOB_2),
/* harmony export */   KNOB_3: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.KNOB_3),
/* harmony export */   KNOB_4: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.KNOB_4),
/* harmony export */   KNOB_5: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.KNOB_5),
/* harmony export */   KNOB_6: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.KNOB_6),
/* harmony export */   KNOB_7: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.KNOB_7),
/* harmony export */   KNOB_8: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.KNOB_8),
/* harmony export */   MIDI_CC_MAX: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MIDI_CC_MAX),
/* harmony export */   MUTE_1: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MUTE_1),
/* harmony export */   MUTE_2: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MUTE_2),
/* harmony export */   MUTE_3: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MUTE_3),
/* harmony export */   MUTE_4: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MUTE_4),
/* harmony export */   MUTE_5: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MUTE_5),
/* harmony export */   MUTE_6: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MUTE_6),
/* harmony export */   MUTE_7: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MUTE_7),
/* harmony export */   MUTE_8: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.MUTE_8),
/* harmony export */   MidiController: () => (/* reexport safe */ _MidiController__WEBPACK_IMPORTED_MODULE_1__.MidiController),
/* harmony export */   NANOKONTROL2_DEF: () => (/* reexport safe */ _definitions_nanokontrol2__WEBPACK_IMPORTED_MODULE_2__.NANOKONTROL2_DEF),
/* harmony export */   NEXT_MARKER: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.NEXT_MARKER),
/* harmony export */   NEXT_TRACK: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.NEXT_TRACK),
/* harmony export */   PLAY: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.PLAY),
/* harmony export */   PREV_MARKER: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.PREV_MARKER),
/* harmony export */   PREV_TRACK: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.PREV_TRACK),
/* harmony export */   RAW: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.RAW),
/* harmony export */   REC: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC),
/* harmony export */   REC_1: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC_1),
/* harmony export */   REC_2: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC_2),
/* harmony export */   REC_3: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC_3),
/* harmony export */   REC_4: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC_4),
/* harmony export */   REC_5: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC_5),
/* harmony export */   REC_6: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC_6),
/* harmony export */   REC_7: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC_7),
/* harmony export */   REC_8: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REC_8),
/* harmony export */   REW: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.REW),
/* harmony export */   SET_MARKER: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SET_MARKER),
/* harmony export */   SLIDER_1: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SLIDER_1),
/* harmony export */   SLIDER_2: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SLIDER_2),
/* harmony export */   SLIDER_3: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SLIDER_3),
/* harmony export */   SLIDER_4: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SLIDER_4),
/* harmony export */   SLIDER_5: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SLIDER_5),
/* harmony export */   SLIDER_6: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SLIDER_6),
/* harmony export */   SLIDER_7: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SLIDER_7),
/* harmony export */   SLIDER_8: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SLIDER_8),
/* harmony export */   SOLO_1: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SOLO_1),
/* harmony export */   SOLO_2: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SOLO_2),
/* harmony export */   SOLO_3: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SOLO_3),
/* harmony export */   SOLO_4: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SOLO_4),
/* harmony export */   SOLO_5: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SOLO_5),
/* harmony export */   SOLO_6: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SOLO_6),
/* harmony export */   SOLO_7: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SOLO_7),
/* harmony export */   SOLO_8: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SOLO_8),
/* harmony export */   STOP: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.STOP),
/* harmony export */   nanoKontrol2Addon: () => (/* reexport safe */ _addon__WEBPACK_IMPORTED_MODULE_0__.nanoKontrol2Addon)
/* harmony export */ });
/* harmony import */ var _addon__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./addon */ "./src/addon.ts");
/* harmony import */ var _MidiController__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./MidiController */ "./src/MidiController.ts");
/* harmony import */ var _definitions_nanokontrol2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./definitions/nanokontrol2 */ "./src/definitions/nanokontrol2.ts");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./constants */ "./src/constants.ts");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./types */ "./src/types.ts");
// p5.nanokontrol2 — a p5.js addon library for the KORG nanoKONTROL2
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
// See README.md for the full public API.
/// <reference path="./p5.nanokontrol2.d.ts" />






// Auto-register with p5 when present (script-tag / global usage).
if (typeof p5 !== 'undefined') {
    p5.registerAddon(_addon__WEBPACK_IMPORTED_MODULE_0__.nanoKontrol2Addon);
}

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=p5.nanokontrol2.js.map