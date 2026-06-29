// Generic, device-independent constants.
//
// Control-name constants (KNOB_1, PLAY, …) are NOT defined here — they are
// device knowledge and live in the device definitions under src/devices/.
// The runtime globals and the ambient TypeScript declarations are both derived
// from those definitions (see src/addon.ts and scripts/gen-types.js).

export const MIDI_CC_MAX = 127;

// Value mode
export const RAW = 'RAW';
export const NORMALIZED = 'NORMALIZED';
