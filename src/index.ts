// p5.nanokontrol2 — a p5.js addon library for the KORG nanoKONTROL2
// (and other MIDI control surfaces) using WebMidi.js v3.
//
// Usage:
//   <script src="https://cdn.jsdelivr.net/npm/webmidi@3/dist/iife/webmidi.iife.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/p5@2.3.0/lib/p5.min.js"></script>
//   <script src="p5.nanokontrol2.js"></script>
//
//   let nano;
//   function setup() { nano = new NanoKontrol2(); }
//   function controlChanged(ctrl) { if (ctrl === KNOB_1) hue = nano.getValue(KNOB_1) * 360; }
//   function buttonPressed(btn) { if (btn === PLAY) playing = true; }
//   function buttonReleased(btn) { if (btn === REC_1) recording = false; }
//
// See README.md for the full public API.

import { nanoKontrol2Addon } from './addon';

export { MidiController } from './MidiController';
export { nanoKontrol2Addon } from './addon';
export { NANOKONTROL2_DEF } from './devices/nanokontrol2.device';
export * from './constants';
export * from './types';

// Auto-register with p5 when present (script-tag / global usage).
if (typeof p5 !== 'undefined') {
  p5.registerAddon(nanoKontrol2Addon);
}
