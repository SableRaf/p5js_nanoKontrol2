// MidiMapper — maps raw MIDI CC numbers to friendly names and exposes
// convenience readers. Holds the latest value per CC internally.
//
// Usage:
//   const mapper = new MidiMapper(ccToName, { defaultValue: 0.5 });
//   nano.update(cc, rawValue);          // feed from your MIDI handler
//   nano.getValue('fader1');            // 0..1  (normalized by default)
//   nano.getValue('fader1', { normalize: false }); // 0..127
//   nano.getValue('fader1', { defaultValue: 0.5 }); // per-call default
//   nano.getButtonPressed('play');      // true / false
//
// Smoothing — configure once, then call interpolate() each frame:
//   nano.setSmooth({ enabled: true, easingType: 'easeOut', duration: 300 });
//   nano.setSmooth({ for: 'fader1', enabled: true, duration: 500 });
//   nano.setSmooth({ for: ['fader1', 'fader2'], easingType: 'easeIn' });
//   nano.interpolate();                 // call at top of draw()
//   nano.getValue('fader1');            // returns smoothed value when enabled

const MIDI_CC_MAX = 127;

// Easing functions — receive the raw speed/blend factor t (0..1).
const EASING = {
  lerp:      t => t,
  easeIn:    t => t * t,
  easeOut:   t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

// Convert a duration in ms to a per-frame blend factor assuming 60 fps.
// A shorter duration → larger t → faster convergence.
function durationToSpeed(ms) {
  // Frames to cover ~95% of the distance: solve (1-t)^n = 0.05 → n = ln(0.05)/ln(1-t)
  // Inverted: t = 1 - 0.05^(1/frames), where frames = duration / (1000/60).
  const frames = Math.max(1, (ms / 1000) * 60);
  return 1 - Math.pow(0.05, 1 / frames);
}

class MidiMapper {
  // ccToName: { [ccNumber]: name }
  // options:  { defaultValue } — normalized 0..1 fallback before any input (default 0)
  constructor(ccToName = {}, { defaultValue = 0 } = {}) {
    this.ccToName = ccToName;
    this.nameToCC = {};
    for (const [cc, name] of Object.entries(ccToName)) {
      this.nameToCC[name] = Number(cc);
    }
    this.values     = {};  // cc → last raw value (0..127)
    this.prevValues = {};  // cc → previous raw value (transition detection)
    this.smoothed   = {};  // cc → smoothed raw value (0..127)

    this._defaultValue = Math.min(Math.max(defaultValue, 0), 1) * MIDI_CC_MAX;
    this._smooth = { enabled: false, easingType: 'lerp', duration: 150 };
    this._smoothPerName = {}; // name → smooth config override
  }

  // Configure smoothing globally, or for specific input(s).
  //   for        — name string or array of names to configure individually;
  //                omit to set globally
  //   enabled    — true/false (default true)
  //   easingType — 'lerp' | 'easeIn' | 'easeOut' | 'easeInOut' (default 'lerp')
  //   duration   — time in ms to reach ~95% of target (default 150)
  setSmooth({ for: names, enabled = true, easingType = 'lerp', duration = 150 } = {}) {
    const config = { enabled, easingType, duration };
    if (names === undefined) {
      this._smooth = config;
    } else {
      for (const name of [].concat(names)) {
        this._smoothPerName[name] = config;
      }
    }
  }

  // Returns the effective smooth config for a named control.
  _smoothFor(name) {
    return this._smoothPerName[name] ?? this._smooth;
  }

  // Feed a raw control-change message in. Returns the resolved name, or null.
  update(cc, rawValue) {
    this.prevValues[cc] = this.values[cc];
    this.values[cc] = rawValue;
    return this.ccToName[cc] ?? null;
  }

  // Advance all smoothed values one step toward their targets.
  // Call once per frame at the top of draw() when smoothing is enabled.
  interpolate() {
    for (const [cc, name] of Object.entries(this.ccToName)) {
      const smooth = this._smoothFor(name);
      if (!smooth.enabled) continue;
      const ease    = EASING[smooth.easingType] ?? EASING.lerp;
      const t       = ease(durationToSpeed(smooth.duration));
      const target  = this.values[cc] ?? this._defaultValue;
      const current = this.smoothed[cc] ?? this._defaultValue;
      this.smoothed[cc] = current + (target - current) * t;
    }
  }

  // Raw 0..127 value for a control, by name.
  // defaultValue (0..1) overrides the global default for this call only.
  getRaw(name, { defaultValue } = {}) {
    const cc = this.nameToCC[name];
    if (cc === undefined) return 0;
    const fallback = defaultValue !== undefined
      ? Math.min(Math.max(defaultValue, 0), 1) * MIDI_CC_MAX
      : this._defaultValue;
    return this.values[cc] ?? fallback;
  }

  // Slider/knob value, normalized to 0..1 by default.
  // Returns the smoothed value when smoothing is enabled.
  // Options: { normalize, defaultValue }
  //   normalize    — true (default) returns 0..1; false returns 0..127
  //   defaultValue — 0..1 fallback before first input, overrides global default
  getValue(name, { normalize = true, defaultValue } = {}) {
    const cc = this.nameToCC[name];
    if (cc === undefined) return 0;

    const fallback = defaultValue !== undefined
      ? Math.min(Math.max(defaultValue, 0), 1) * MIDI_CC_MAX
      : this._defaultValue;

    const smooth = this._smoothFor(name);
    let raw;
    if (smooth.enabled) {
      raw = this.smoothed[cc] ?? fallback;
    } else {
      raw = this.values[cc] ?? fallback;
    }
    return normalize ? raw / MIDI_CC_MAX : raw;
  }

  // Button state — any value above 0 counts as pressed.
  getButtonPressed(name) {
    const cc = this.nameToCC[name];
    if (cc === undefined) return false;
    return (this.values[cc] ?? 0) > 0;
  }

  // True only on the frame the button transitions from released to pressed.
  isPressed(name) {
    const cc = this.nameToCC[name];
    if (cc === undefined) return false;
    const current = this.values[cc] ?? 0;
    const prev    = this.prevValues[cc] ?? 0;
    return current > 0 && prev === 0;
  }

  // True only on the frame the button transitions from pressed to released.
  isReleased(name) {
    const cc = this.nameToCC[name];
    if (cc === undefined) return false;
    const current = this.values[cc] ?? 0;
    const prev    = this.prevValues[cc] ?? 0;
    return current === 0 && prev > 0;
  }

  // True if we've ever received a message for this control.
  has(name) {
    const cc = this.nameToCC[name];
    return cc !== undefined && this.values[cc] !== undefined;
  }
}
