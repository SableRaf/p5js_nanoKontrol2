// Shared types for the p5.nanokontrol2 library.

export type ControlType = 'continuous' | 'button';

export interface Control {
  /** MIDI Control Change number. */
  cc: number;
  /** Public constant name, e.g. 'SLIDER_1'. */
  name: string;
  /** Whether the control reports a continuous value or acts as a button. */
  type: ControlType;
}

export interface ControllerDefinition {
  /** Matched (substring) against WebMidi port names. */
  name: string;
  controls: Control[];
}

export type EasingType = 'lerp' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface MidiControllerOptions {
  /** Normalized 0..1 fallback before any input. */
  defaultValue?: number;
  /** When true, log raw MIDI events to the console. */
  debugLogs?: boolean;
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
