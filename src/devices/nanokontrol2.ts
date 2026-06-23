// nanoKONTROL2 controller definition — the single source of truth for this
// device's control names, CC numbers, and types. The public input constants
// (exposed as p5 globals) and the ambient TypeScript declarations are both
// derived from this object. To support a different controller, define a new
// object of the same shape and pass it to `new MidiController(def)`.

import type { ControllerDefinition } from '../types';

export const NANOKONTROL2_DEF: ControllerDefinition = {
  name: 'nanoKONTROL2', // matched against WebMidi port names
  controls: [
    // Sliders (CC 0..7)
    { cc: 0, name: 'SLIDER_1', type: 'continuous' },
    { cc: 1, name: 'SLIDER_2', type: 'continuous' },
    { cc: 2, name: 'SLIDER_3', type: 'continuous' },
    { cc: 3, name: 'SLIDER_4', type: 'continuous' },
    { cc: 4, name: 'SLIDER_5', type: 'continuous' },
    { cc: 5, name: 'SLIDER_6', type: 'continuous' },
    { cc: 6, name: 'SLIDER_7', type: 'continuous' },
    { cc: 7, name: 'SLIDER_8', type: 'continuous' },
    // Knobs (CC 16..23)
    { cc: 16, name: 'KNOB_1', type: 'continuous' },
    { cc: 17, name: 'KNOB_2', type: 'continuous' },
    { cc: 18, name: 'KNOB_3', type: 'continuous' },
    { cc: 19, name: 'KNOB_4', type: 'continuous' },
    { cc: 20, name: 'KNOB_5', type: 'continuous' },
    { cc: 21, name: 'KNOB_6', type: 'continuous' },
    { cc: 22, name: 'KNOB_7', type: 'continuous' },
    { cc: 23, name: 'KNOB_8', type: 'continuous' },
    // Solo (CC 32..39)
    { cc: 32, name: 'SOLO_1', type: 'button' },
    { cc: 33, name: 'SOLO_2', type: 'button' },
    { cc: 34, name: 'SOLO_3', type: 'button' },
    { cc: 35, name: 'SOLO_4', type: 'button' },
    { cc: 36, name: 'SOLO_5', type: 'button' },
    { cc: 37, name: 'SOLO_6', type: 'button' },
    { cc: 38, name: 'SOLO_7', type: 'button' },
    { cc: 39, name: 'SOLO_8', type: 'button' },
    // Mute (CC 48..55)
    { cc: 48, name: 'MUTE_1', type: 'button' },
    { cc: 49, name: 'MUTE_2', type: 'button' },
    { cc: 50, name: 'MUTE_3', type: 'button' },
    { cc: 51, name: 'MUTE_4', type: 'button' },
    { cc: 52, name: 'MUTE_5', type: 'button' },
    { cc: 53, name: 'MUTE_6', type: 'button' },
    { cc: 54, name: 'MUTE_7', type: 'button' },
    { cc: 55, name: 'MUTE_8', type: 'button' },
    // Rec (CC 64..71)
    { cc: 64, name: 'REC_1', type: 'button' },
    { cc: 65, name: 'REC_2', type: 'button' },
    { cc: 66, name: 'REC_3', type: 'button' },
    { cc: 67, name: 'REC_4', type: 'button' },
    { cc: 68, name: 'REC_5', type: 'button' },
    { cc: 69, name: 'REC_6', type: 'button' },
    { cc: 70, name: 'REC_7', type: 'button' },
    { cc: 71, name: 'REC_8', type: 'button' },
    // Transport
    { cc: 41, name: 'PLAY', type: 'button' },
    { cc: 42, name: 'STOP', type: 'button' },
    { cc: 43, name: 'REW', type: 'button' },
    { cc: 44, name: 'FF', type: 'button' },
    { cc: 45, name: 'REC', type: 'button' },
    { cc: 46, name: 'CYCLE', type: 'button' },
    // Navigation
    { cc: 58, name: 'PREV_TRACK', type: 'button' },
    { cc: 59, name: 'NEXT_TRACK', type: 'button' },
    { cc: 60, name: 'SET_MARKER', type: 'button' },
    { cc: 61, name: 'PREV_MARKER', type: 'button' },
    { cc: 62, name: 'NEXT_MARKER', type: 'button' },
  ],
};
