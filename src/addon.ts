// p5 addon registration.

import { NORMALIZED, RAW } from './constants';
import { MidiController } from './MidiController';
import { NANOKONTROL2_DEF } from './devices/nanokontrol2.device';
import type { MidiControllerOptions } from './types';

export function nanoKontrol2Addon(p5: any, fn: any, lifecycles: any): void {
  // Expose input/mode constants as p5 globals. Control-name constants are
  // derived from the device definition (the source of truth); RAW and other
  // generic constants are added alongside them.
  fn.RAW = RAW;
  fn.NORMALIZED = NORMALIZED;
  for (const ctrl of NANOKONTROL2_DEF.controls) {
    fn[ctrl.constant] = ctrl.constant;
  }

  // Expose the generic engine for power users defining custom controllers.
  fn.MidiController = MidiController;

  // Device-specific class. We must store state on the live p5 instance so the
  // controller can reach `_customActions` and `predraw` can find the controller.
  // In global mode `this` is `window` (p5 calls setup() as window.setup()), not
  // the p5 instance — so fall back to the static `p5.instance` in that case.
  // options — { debugLogs } to log raw MIDI events to the console.
  fn.NanoKontrol2 = function (this: any, options: MidiControllerOptions = {}) {
    const sketch = (this instanceof p5) ? this : p5.instance;
    const controller = new MidiController(NANOKONTROL2_DEF, options);
    controller._p5 = sketch;
    sketch._nanoKontrol2Instance = controller;
    return controller;
  };

  // Advance smoothing once per frame, before the user's draw() runs.
  lifecycles.predraw = function (this: any) {
    const instance = this._nanoKontrol2Instance;
    if (!instance) return;
    if (instance._debugLogs && !instance._predrawLogged) {
      instance._predrawLogged = true;
      console.log('[nanokontrol2] predraw hook is running — smoothing active');
    }
    instance._interpolate();
  };
}
