// Consumer-facing ambient declarations.
//
// In p5 "global mode" (the usual sketch style) the addon exposes its class and
// input constants as window globals. This file declares them so TypeScript
// sketch authors get autocomplete and type-checking. Reference it from a sketch
// with:  /// <reference types="p5.nanokontrol2" />
//
// Note: the `inputChanged`, `buttonPressed`, and `buttonReleased` callbacks are
// defined by the sketch author, so they are intentionally not declared here.

import type { MidiController } from './MidiController';
import type { MidiControllerOptions } from './types';

export {};

declare global {
  /** Device-specific controller for the KORG nanoKONTROL2. */
  const NanoKontrol2: new (options?: MidiControllerOptions) => MidiController;

  /** Generic engine for defining custom controllers. */
  const MidiController: typeof import('./MidiController').MidiController;

  // Input mode
  const RAW: string;

  // Transport
  const CYCLE: string, REW: string, FF: string, STOP: string, PLAY: string, REC: string;

  // Navigation / function buttons
  const PREV_TRACK: string, NEXT_TRACK: string, SET_MARKER: string;
  const PREV_MARKER: string, NEXT_MARKER: string;

  // Channel controls (×8)
  const KNOB_1: string, KNOB_2: string, KNOB_3: string, KNOB_4: string;
  const KNOB_5: string, KNOB_6: string, KNOB_7: string, KNOB_8: string;

  const SLIDER_1: string, SLIDER_2: string, SLIDER_3: string, SLIDER_4: string;
  const SLIDER_5: string, SLIDER_6: string, SLIDER_7: string, SLIDER_8: string;

  const SOLO_1: string, SOLO_2: string, SOLO_3: string, SOLO_4: string;
  const SOLO_5: string, SOLO_6: string, SOLO_7: string, SOLO_8: string;

  const MUTE_1: string, MUTE_2: string, MUTE_3: string, MUTE_4: string;
  const MUTE_5: string, MUTE_6: string, MUTE_7: string, MUTE_8: string;

  const REC_1: string, REC_2: string, REC_3: string, REC_4: string;
  const REC_5: string, REC_6: string, REC_7: string, REC_8: string;
}
