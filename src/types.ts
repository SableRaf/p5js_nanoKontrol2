// Shared types for the p5.nanokontrol2 library.

export type ControlType = 'continuous' | 'momentary' | 'toggle';
export type CtrlType = 'cc';

export interface Control {
  /** Public constant name, e.g. 'SLIDER_1'. */
  constant: string;
  /** Human-readable label, e.g. 'Fader 1'. */
  title: string;
  /** MIDI message type — 'cc' for Control Change. */
  ctrlType: CtrlType;
  /** One or more CC numbers this control listens on. */
  ctrlIndex: number[];
  /** MIDI channel (1-based). */
  channel: number;
  /** Whether the control reports a continuous value, momentary value, or toggle state. */
  type: ControlType;
  /** Whether the physical button has an LED. Defaults to true for momentary/toggle controls. */
  hasLed?: boolean;
  /** Optional OSC-style parameter path, e.g. '/strip/1/fader'. */
  paramPath?: string;
  /** Minimum raw MIDI value (default 0). */
  lower: number;
  /** Maximum raw MIDI value (default 127). */
  upper: number;
}

export interface ControllerDefinition {
  manufacturer: string;
  /** Matched (substring) against WebMidi port names. */
  model: string;
  version: string;
  controls: Control[];
}

export type EasingType = 'lerp' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface MidiControllerOptions {
  /** Normalized 0..1 fallback before any input. */
  defaultValue?: number;
  /** When true, log raw MIDI events to the console. */
  debugLogs?: boolean;
  /** Called once the MIDI port is connected and the startup LED sequence has finished. */
  onReady?: () => void;
  /** Called whenever the device is connected (including at startup). */
  onConnected?: () => void;
  /** Called whenever the device is disconnected. */
  onDisconnected?: () => void;
}

export interface SmoothConfig {
  enabled: boolean;
  easingType: EasingType;
  duration: number;
}

export interface SetSmoothOptions extends Partial<SmoothConfig> {
  /** Name string or array of names; omit to set globally. */
  inputName?: string | string[];
}

export interface GetValueOptions {
  defaultValue?: number;
  smoothed?: boolean;
}
