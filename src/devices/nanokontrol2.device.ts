// nanoKONTROL2 controller definition — the single source of truth for this
// device's control names, CC numbers, and types. The public input constants
// (exposed as p5 globals) and the ambient TypeScript declarations are both
// derived from this object. To support a different controller, define a new
// object of the same shape and pass it to `new MidiController(def)`.

import type { ControllerDefinition } from '../types';

export const NANOKONTROL2_DEF: ControllerDefinition = {
  manufacturer: 'KORG',
  model: 'nanoKONTROL2', // matched against WebMidi port names
  version: '1.0',
  controls: [
    // Sliders (CC 0..7)
    { constant: 'SLIDER_1', title: 'Slider 1', ctrlType: 'cc', ctrlIndex: [0],  channel: 1, type: 'continuous', paramPath: '/strip/1/fader', lower: 0, upper: 127 },
    { constant: 'SLIDER_2', title: 'Slider 2', ctrlType: 'cc', ctrlIndex: [1],  channel: 1, type: 'continuous', paramPath: '/strip/2/fader', lower: 0, upper: 127 },
    { constant: 'SLIDER_3', title: 'Slider 3', ctrlType: 'cc', ctrlIndex: [2],  channel: 1, type: 'continuous', paramPath: '/strip/3/fader', lower: 0, upper: 127 },
    { constant: 'SLIDER_4', title: 'Slider 4', ctrlType: 'cc', ctrlIndex: [3],  channel: 1, type: 'continuous', paramPath: '/strip/4/fader', lower: 0, upper: 127 },
    { constant: 'SLIDER_5', title: 'Slider 5', ctrlType: 'cc', ctrlIndex: [4],  channel: 1, type: 'continuous', paramPath: '/strip/5/fader', lower: 0, upper: 127 },
    { constant: 'SLIDER_6', title: 'Slider 6', ctrlType: 'cc', ctrlIndex: [5],  channel: 1, type: 'continuous', paramPath: '/strip/6/fader', lower: 0, upper: 127 },
    { constant: 'SLIDER_7', title: 'Slider 7', ctrlType: 'cc', ctrlIndex: [6],  channel: 1, type: 'continuous', paramPath: '/strip/7/fader', lower: 0, upper: 127 },
    { constant: 'SLIDER_8', title: 'Slider 8', ctrlType: 'cc', ctrlIndex: [7],  channel: 1, type: 'continuous', paramPath: '/strip/8/fader', lower: 0, upper: 127 },
    // Knobs (CC 16..23)
    { constant: 'KNOB_1', title: 'Knob 1', ctrlType: 'cc', ctrlIndex: [16], channel: 1, type: 'continuous', paramPath: '/strip/1/send', lower: 0, upper: 127 },
    { constant: 'KNOB_2', title: 'Knob 2', ctrlType: 'cc', ctrlIndex: [17], channel: 1, type: 'continuous', paramPath: '/strip/2/send', lower: 0, upper: 127 },
    { constant: 'KNOB_3', title: 'Knob 3', ctrlType: 'cc', ctrlIndex: [18], channel: 1, type: 'continuous', paramPath: '/strip/3/send', lower: 0, upper: 127 },
    { constant: 'KNOB_4', title: 'Knob 4', ctrlType: 'cc', ctrlIndex: [19], channel: 1, type: 'continuous', paramPath: '/strip/4/send', lower: 0, upper: 127 },
    { constant: 'KNOB_5', title: 'Knob 5', ctrlType: 'cc', ctrlIndex: [20], channel: 1, type: 'continuous', paramPath: '/strip/5/send', lower: 0, upper: 127 },
    { constant: 'KNOB_6', title: 'Knob 6', ctrlType: 'cc', ctrlIndex: [21], channel: 1, type: 'continuous', paramPath: '/strip/6/send', lower: 0, upper: 127 },
    { constant: 'KNOB_7', title: 'Knob 7', ctrlType: 'cc', ctrlIndex: [22], channel: 1, type: 'continuous', paramPath: '/strip/7/send', lower: 0, upper: 127 },
    { constant: 'KNOB_8', title: 'Knob 8', ctrlType: 'cc', ctrlIndex: [23], channel: 1, type: 'continuous', paramPath: '/strip/8/send', lower: 0, upper: 127 },
    // Solo (CC 32..39)
    { constant: 'SOLO_1', title: 'Solo 1', ctrlType: 'cc', ctrlIndex: [32], channel: 1, type: 'toggle', paramPath: '/strip/1/solo', lower: 0, upper: 127 },
    { constant: 'SOLO_2', title: 'Solo 2', ctrlType: 'cc', ctrlIndex: [33], channel: 1, type: 'toggle', paramPath: '/strip/2/solo', lower: 0, upper: 127 },
    { constant: 'SOLO_3', title: 'Solo 3', ctrlType: 'cc', ctrlIndex: [34], channel: 1, type: 'toggle', paramPath: '/strip/3/solo', lower: 0, upper: 127 },
    { constant: 'SOLO_4', title: 'Solo 4', ctrlType: 'cc', ctrlIndex: [35], channel: 1, type: 'toggle', paramPath: '/strip/4/solo', lower: 0, upper: 127 },
    { constant: 'SOLO_5', title: 'Solo 5', ctrlType: 'cc', ctrlIndex: [36], channel: 1, type: 'toggle', paramPath: '/strip/5/solo', lower: 0, upper: 127 },
    { constant: 'SOLO_6', title: 'Solo 6', ctrlType: 'cc', ctrlIndex: [37], channel: 1, type: 'toggle', paramPath: '/strip/6/solo', lower: 0, upper: 127 },
    { constant: 'SOLO_7', title: 'Solo 7', ctrlType: 'cc', ctrlIndex: [38], channel: 1, type: 'toggle', paramPath: '/strip/7/solo', lower: 0, upper: 127 },
    { constant: 'SOLO_8', title: 'Solo 8', ctrlType: 'cc', ctrlIndex: [39], channel: 1, type: 'toggle', paramPath: '/strip/8/solo', lower: 0, upper: 127 },
    // Mute (CC 48..55)
    { constant: 'MUTE_1', title: 'Mute 1', ctrlType: 'cc', ctrlIndex: [48], channel: 1, type: 'toggle', paramPath: '/strip/1/mute', lower: 0, upper: 127 },
    { constant: 'MUTE_2', title: 'Mute 2', ctrlType: 'cc', ctrlIndex: [49], channel: 1, type: 'toggle', paramPath: '/strip/2/mute', lower: 0, upper: 127 },
    { constant: 'MUTE_3', title: 'Mute 3', ctrlType: 'cc', ctrlIndex: [50], channel: 1, type: 'toggle', paramPath: '/strip/3/mute', lower: 0, upper: 127 },
    { constant: 'MUTE_4', title: 'Mute 4', ctrlType: 'cc', ctrlIndex: [51], channel: 1, type: 'toggle', paramPath: '/strip/4/mute', lower: 0, upper: 127 },
    { constant: 'MUTE_5', title: 'Mute 5', ctrlType: 'cc', ctrlIndex: [52], channel: 1, type: 'toggle', paramPath: '/strip/5/mute', lower: 0, upper: 127 },
    { constant: 'MUTE_6', title: 'Mute 6', ctrlType: 'cc', ctrlIndex: [53], channel: 1, type: 'toggle', paramPath: '/strip/6/mute', lower: 0, upper: 127 },
    { constant: 'MUTE_7', title: 'Mute 7', ctrlType: 'cc', ctrlIndex: [54], channel: 1, type: 'toggle', paramPath: '/strip/7/mute', lower: 0, upper: 127 },
    { constant: 'MUTE_8', title: 'Mute 8', ctrlType: 'cc', ctrlIndex: [55], channel: 1, type: 'toggle', paramPath: '/strip/8/mute', lower: 0, upper: 127 },
    // Rec (CC 64..71)
    { constant: 'REC_1', title: 'Rec 1', ctrlType: 'cc', ctrlIndex: [64], channel: 1, type: 'toggle', paramPath: '/strip/1/rec', lower: 0, upper: 127 },
    { constant: 'REC_2', title: 'Rec 2', ctrlType: 'cc', ctrlIndex: [65], channel: 1, type: 'toggle', paramPath: '/strip/2/rec', lower: 0, upper: 127 },
    { constant: 'REC_3', title: 'Rec 3', ctrlType: 'cc', ctrlIndex: [66], channel: 1, type: 'toggle', paramPath: '/strip/3/rec', lower: 0, upper: 127 },
    { constant: 'REC_4', title: 'Rec 4', ctrlType: 'cc', ctrlIndex: [67], channel: 1, type: 'toggle', paramPath: '/strip/4/rec', lower: 0, upper: 127 },
    { constant: 'REC_5', title: 'Rec 5', ctrlType: 'cc', ctrlIndex: [68], channel: 1, type: 'toggle', paramPath: '/strip/5/rec', lower: 0, upper: 127 },
    { constant: 'REC_6', title: 'Rec 6', ctrlType: 'cc', ctrlIndex: [69], channel: 1, type: 'toggle', paramPath: '/strip/6/rec', lower: 0, upper: 127 },
    { constant: 'REC_7', title: 'Rec 7', ctrlType: 'cc', ctrlIndex: [70], channel: 1, type: 'toggle', paramPath: '/strip/7/rec', lower: 0, upper: 127 },
    { constant: 'REC_8', title: 'Rec 8', ctrlType: 'cc', ctrlIndex: [71], channel: 1, type: 'toggle', paramPath: '/strip/8/rec', lower: 0, upper: 127 },
    // Transport
    { constant: 'PLAY',  title: 'Play',  ctrlType: 'cc', ctrlIndex: [41], channel: 1, type: 'momentary', paramPath: '/transport/play', lower: 0, upper: 127 },
    { constant: 'STOP',  title: 'Stop',  ctrlType: 'cc', ctrlIndex: [42], channel: 1, type: 'momentary', paramPath: '/transport/stop', lower: 0, upper: 127 },
    { constant: 'REW',   title: 'Rewind', ctrlType: 'cc', ctrlIndex: [43], channel: 1, type: 'momentary', paramPath: '/transport/rewind', lower: 0, upper: 127 },
    { constant: 'FF',    title: 'Fast Forward', ctrlType: 'cc', ctrlIndex: [44], channel: 1, type: 'momentary', paramPath: '/transport/fastforward', lower: 0, upper: 127 },
    { constant: 'REC',   title: 'Record', ctrlType: 'cc', ctrlIndex: [45], channel: 1, type: 'momentary', paramPath: '/transport/rec', lower: 0, upper: 127 },
    { constant: 'CYCLE', title: 'Cycle', ctrlType: 'cc', ctrlIndex: [46], channel: 1, type: 'momentary', paramPath: '/transport/cycle', lower: 0, upper: 127 },
    // Navigation
    { constant: 'PREV_TRACK',  title: 'Prev Track',  ctrlType: 'cc', ctrlIndex: [58], channel: 1, type: 'momentary', paramPath: '/navigation/prevTrack', lower: 0, upper: 127 },
    { constant: 'NEXT_TRACK',  title: 'Next Track',  ctrlType: 'cc', ctrlIndex: [59], channel: 1, type: 'momentary', paramPath: '/navigation/nextTrack', lower: 0, upper: 127 },
    { constant: 'SET_MARKER',  title: 'Set Marker',  ctrlType: 'cc', ctrlIndex: [60], channel: 1, type: 'momentary', paramPath: '/navigation/setMarker', lower: 0, upper: 127 },
    { constant: 'PREV_MARKER', title: 'Prev Marker', ctrlType: 'cc', ctrlIndex: [61], channel: 1, type: 'momentary', paramPath: '/navigation/prevMarker', lower: 0, upper: 127 },
    { constant: 'NEXT_MARKER', title: 'Next Marker', ctrlType: 'cc', ctrlIndex: [62], channel: 1, type: 'momentary', paramPath: '/navigation/nextMarker', lower: 0, upper: 127 },
  ],
};
