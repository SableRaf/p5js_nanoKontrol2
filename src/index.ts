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

import { nanoKontrol2Addon } from './addon';

export { MidiController } from './MidiController';
export { nanoKontrol2Addon } from './addon';
export { NANOKONTROL2_DEF } from './devices/nanokontrol2';
export * from './constants';
export * from './types';

// Auto-register with p5 when present (script-tag / global usage).
if (typeof p5 !== 'undefined') {
  p5.registerAddon(nanoKontrol2Addon);
}
