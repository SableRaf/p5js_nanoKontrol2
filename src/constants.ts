// Input constants exposed as p5 globals.

export const MIDI_CC_MAX = 127;

// Transport
export const CYCLE = 'CYCLE';
export const REW = 'REW';
export const FF = 'FF';
export const STOP = 'STOP';
export const PLAY = 'PLAY';
export const REC = 'REC';

// Navigation / function buttons
export const PREV_TRACK = 'PREV_TRACK';
export const NEXT_TRACK = 'NEXT_TRACK';
export const SET_MARKER = 'SET_MARKER';
export const PREV_MARKER = 'PREV_MARKER';
export const NEXT_MARKER = 'NEXT_MARKER';

// Channel controls (×8)
export const KNOB_1 = 'KNOB_1', KNOB_2 = 'KNOB_2', KNOB_3 = 'KNOB_3', KNOB_4 = 'KNOB_4';
export const KNOB_5 = 'KNOB_5', KNOB_6 = 'KNOB_6', KNOB_7 = 'KNOB_7', KNOB_8 = 'KNOB_8';

export const SLIDER_1 = 'SLIDER_1', SLIDER_2 = 'SLIDER_2', SLIDER_3 = 'SLIDER_3', SLIDER_4 = 'SLIDER_4';
export const SLIDER_5 = 'SLIDER_5', SLIDER_6 = 'SLIDER_6', SLIDER_7 = 'SLIDER_7', SLIDER_8 = 'SLIDER_8';

export const SOLO_1 = 'SOLO_1', SOLO_2 = 'SOLO_2', SOLO_3 = 'SOLO_3', SOLO_4 = 'SOLO_4';
export const SOLO_5 = 'SOLO_5', SOLO_6 = 'SOLO_6', SOLO_7 = 'SOLO_7', SOLO_8 = 'SOLO_8';

export const MUTE_1 = 'MUTE_1', MUTE_2 = 'MUTE_2', MUTE_3 = 'MUTE_3', MUTE_4 = 'MUTE_4';
export const MUTE_5 = 'MUTE_5', MUTE_6 = 'MUTE_6', MUTE_7 = 'MUTE_7', MUTE_8 = 'MUTE_8';

export const REC_1 = 'REC_1', REC_2 = 'REC_2', REC_3 = 'REC_3', REC_4 = 'REC_4';
export const REC_5 = 'REC_5', REC_6 = 'REC_6', REC_7 = 'REC_7', REC_8 = 'REC_8';

// Input mode
export const RAW = 'RAW';

// Collected for bulk exposure on `fn`.
export const CONSTANTS: Record<string, string> = {
  CYCLE, REW, FF, STOP, PLAY, REC,
  PREV_TRACK, NEXT_TRACK, SET_MARKER, PREV_MARKER, NEXT_MARKER,
  KNOB_1, KNOB_2, KNOB_3, KNOB_4, KNOB_5, KNOB_6, KNOB_7, KNOB_8,
  SLIDER_1, SLIDER_2, SLIDER_3, SLIDER_4, SLIDER_5, SLIDER_6, SLIDER_7, SLIDER_8,
  SOLO_1, SOLO_2, SOLO_3, SOLO_4, SOLO_5, SOLO_6, SOLO_7, SOLO_8,
  MUTE_1, MUTE_2, MUTE_3, MUTE_4, MUTE_5, MUTE_6, MUTE_7, MUTE_8,
  REC_1, REC_2, REC_3, REC_4, REC_5, REC_6, REC_7, REC_8,
  RAW,
};
