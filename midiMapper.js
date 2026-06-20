// MidiMapper — maps raw MIDI CC numbers to friendly names and exposes
// convenience readers. Holds the latest value per CC internally.
//
// Usage:
//   const mapper = new MidiMapper({
//     0: 'fader1', 1: 'fader2',
//     32: 'soloBtn1', 41: 'play',
//   });
//   nano.update(cc, rawValue);          // feed from your MIDI handler
//   nano.getValue('fader1');      // 0..1   (normalized by default)
//   nano.getValue('fader1', { normalize: false }); // 0..127
//   nano.getButtonPressed('play');      // true / false

const MIDI_CC_MAX = 127;

class MidiMapper {
  // ccToName: { [ccNumber]: name }
  constructor(ccToName = {}) {
    this.ccToName = ccToName;
    this.nameToCC = {};
    for (const [cc, name] of Object.entries(ccToName)) {
      this.nameToCC[name] = Number(cc);
    }
    this.values = {};   // cc number → last raw value (0..127)
    this.prevValues = {}; // cc number → previous raw value for transition detection
  }

  // Feed a raw control-change message in. Returns the resolved name, or null
  // if the CC isn't mapped (still stored, so unmapped CCs can be inspected).
  update(cc, rawValue) {
    this.prevValues[cc] = this.values[cc];
    this.values[cc] = rawValue;
    return this.ccToName[cc] ?? null;
  }

  // Raw 0..127 value for a control, by name. Returns `fallback` if unseen.
  getRaw(name, fallback = 0) {
    const cc = this.nameToCC[name];
    if (cc === undefined) return fallback;
    return this.values[cc] ?? fallback;
  }

  // Slider/knob value. Normalized to 0..1 by default; pass
  // { normalize: false } for the raw 0..127 byte.
  getValue(name, { normalize = true } = {}) {
    const raw = this.getRaw(name);
    return normalize ? raw / MIDI_CC_MAX : raw;
  }

  // Button state — any value above 0 counts as pressed
  // (the nanoKONTROL2 sends 127 down / 0 up).
  getButtonPressed(name) {
    return this.getRaw(name) > 0;
  }

  // True only on the frame the button transitions from released to pressed.
  isPressed(name) {
    const cc = this.nameToCC[name];
    if (cc === undefined) return false;
    const current = this.values[cc] ?? 0;
    const prev = this.prevValues[cc] ?? 0;
    return current > 0 && prev === 0;
  }

  // True only on the frame the button transitions from pressed to released.
  isReleased(name) {
    const cc = this.nameToCC[name];
    if (cc === undefined) return false;
    const current = this.values[cc] ?? 0;
    const prev = this.prevValues[cc] ?? 0;
    return current === 0 && prev > 0;
  }

  // True if we've ever received a message for this control.
  has(name) {
    const cc = this.nameToCC[name];
    return cc !== undefined && this.values[cc] !== undefined;
  }
}