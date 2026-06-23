import type { ControllerDefinition, GetValueOptions, MidiControllerOptions, SetSmoothOptions } from './types';
export declare class MidiController {
    private _def;
    private _debugLogs;
    private _ccMap;
    private _nameToCC;
    /** Constant of the last-triggered control. */
    input: string | null;
    /** Value of the last-triggered control. */
    value: number;
    private _values;
    private _prevValues;
    private _smoothed;
    private _rawMode;
    private _rawGlobal;
    private _defaultValue;
    private _smooth;
    private _smoothPerName;
    /** WebMidi output port for LED control. */
    private _output;
    /** Reference to the owning p5 instance (set by the addon factory). */
    _p5: any;
    _predrawLogged: boolean;
    constructor(definition: ControllerDefinition, { defaultValue, debugLogs }?: MidiControllerOptions);
    inputMode(a: string, b?: string): void;
    setLed(name: string, on: boolean): void;
    setSmooth({ inputName, enabled, easingType, duration }?: SetSmoothOptions): void;
    private _smoothFor;
    getValue(name: string, { defaultValue, smoothed }?: GetValueOptions): number;
    private _update;
    _interpolate(): void;
    private _initMidi;
    private _onEnabled;
    private _listenTo;
    private _onControlChange;
    private _onOtherMessage;
    private _ledStartupSequence;
}
