# p5.nanokontrol2 API Reference

## Constructor

```js
new NanoKontrol2()
```
You can also pass an options object to enable debug logging:

```js
new NanoKontrol2({ debugLogs: true })
```

| Option | Type | Default | Description |
|---|---|---|---|
| `debugLogs` | `boolean` | `false` | Log raw MIDI events and lifecycle messages to the console. |

---

## Control names

Controls are referenced by ALL_CAPS string constants, exposed as p5 globals.

- **Sliders & knobs:** `SLIDER_1` to `SLIDER_8`, `KNOB_1` to `KNOB_8`
- **Parameter buttons:** `SOLO_1` to `SOLO_8`, `MUTE_1` to `MUTE_8`, `REC_1` to `REC_8`
- **Transport buttons:** `PLAY`, `STOP`, `REW`, `FF`, `REC`, `CYCLE`
- **Function buttons:** `PREV_TRACK`, `NEXT_TRACK`, `SET_MARKER`, `PREV_MARKER`, `NEXT_MARKER`


## Properties

### `midi.input`

The last-triggered control, as an object `{ name, type, hasLed }`. Use it inside event callbacks to identify which control was triggered:

```js
function inputChanged() {
  if (midi.input.name === KNOB_1) hue = midi.value * 360;
}
```

Or, when iterating over numbered controls, you can compare `midi.input.name` against a string name directly:

```js
function inputChanged() {
  for (let i = 0; i < 8; i++) {
    if (midi.input.name === `SLIDER_${i + 1}`) { ... }
  }
}
```

### `midi.value`

The value of the last-triggered control, set before each event callback fires.

- For sliders and knobs: `0..1` (normalized), or `0..127` in [RAW mode](#inputmode).
- For buttons: `1` on press, `0` on release.

### `midi.isConnected`

`true` when a MIDI output port for the device is available.

---

## Events

Define these as global functions. The library calls them automatically.

### `inputChanged()`

Called whenever a knob or slider moves. When smoothing is enabled, it is also re-fired each frame while the value is settling toward its target.

```js
function inputChanged() {
  if (midi.input.name === KNOB_1) hue = midi.value * 360;
  if (midi.input.name === SLIDER_1) radius = midi.value;
}
```

### `buttonPressed()`

Called once when a button is pressed.

```js
function buttonPressed() {
  if (midi.input.name === PLAY) playing = true;
  if (midi.input.name === STOP) playing = false;
}
```

### `buttonReleased()`

Called once when a button is released.

```js
function buttonReleased() {
  if (midi.input.name === REC_1) recording = false;
}
```

### `deviceConnected()`

Called when the nanoKONTROL2 is connected (including on page load if already plugged in).

```js
function deviceConnected() {
  console.log('nanoKONTROL2 connected');
}
```

### `deviceDisconnected()`

Called when the nanoKONTROL2 is unplugged.

```js
function deviceDisconnected() {
  console.log('nanoKONTROL2 disconnected');
}
```

---

## Methods

### `getValue(name, options?)`

Read a control's current value by name, without waiting for an event.

```js
midi.getValue(SLIDER_1);                        // 0..1 (smoothed if enabled)
midi.getValue(SLIDER_1, { smoothed: false });   // immediate target value
midi.getValue(SLIDER_1, { defaultValue: 0.5 }); // 0.5 before first touch
```

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultValue` | `number` (0–1) | `0` | Returned for a control that has not yet received any message instead of snapping to zero on first touch |
| `smoothed` | `boolean` | `true` | When `false`, returns the immediate target value, bypassing smoothing. |

Returns `0..1` by default, or `0..127` in [RAW mode](#inputmode).

---

### `inputMode(mode)` / `inputMode(name, mode)`

Switch between normalized and raw value ranges.

```js
midi.inputMode(RAW);          // all controls report 0..127
midi.inputMode(NORMALIZED);   // all controls report 0..1 (default)
midi.inputMode(KNOB_1, RAW);  // only KNOB_1 reports 0..127
```

---

### `setSmooth(options)`

Configure value smoothing globally or per control. Smoothing interpolates values toward their target each frame, removing jitter and creating gradual transitions. It runs automatically via a `predraw` hook.

```js
midi.setSmooth({ enabled: true, easingType: 'easeOut', duration: 200 });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `inputName` | `string` or `string[]` | — | Control(s) to configure. Omit to apply globally. |
| `enabled` | `boolean` | `true` | Turn smoothing on or off. |
| `easingType` | `string` | `'lerp'` | Shape of the interpolation curve (see below). |
| `duration` | `number` (ms) | `150` | Time to reach ~95% of the target value (assumes 60 fps). |

**Easing types:** `'lerp'`, `'easeIn'`, `'easeOut'`, `'easeInOut'`

```js
// Single control
midi.setSmooth({ inputName: SLIDER_1, duration: 500 });

// Multiple controls
midi.setSmooth({ inputName: [SLIDER_1, SLIDER_2], easingType: 'easeIn', duration: 300 });

// Disable smoothing for one control while keeping it globally
midi.setSmooth({ inputName: KNOB_1, enabled: false });
```

Per-control settings take precedence over the global setting.

---

### `setLed(name, on)`

Turn a button LED on or off.

```js
midi.setLed(PLAY, true);    // turn PLAY LED on
midi.setLed(STOP, false);   // turn STOP LED off
midi.setLed(SOLO_1, true);  // works for any named button
```

> [!IMPORTANT]
> External LED control only works when the nanoKONTROL2's **LED Mode is set to "External"**: download and open the [KORG KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/), go to the Control tab, select "Common", and set LED Mode to "External".

Function buttons (`PREV_TRACK`, `NEXT_TRACK`, `SET_MARKER`, `PREV_MARKER`, `NEXT_MARKER`) have no LEDs and are silently ignored.

---

### `setAllLeds(on)`

Turn all button LEDs on or off at once.

```js
midi.setAllLeds(true);   // all LEDs on
midi.setAllLeds(false);  // all LEDs off
```

---

### `getControl(name)`

Returns the control metadata object `{ name, type, hasLed }` for a given constant, or `undefined` if the name is not recognized.

```js
const ctrl = midi.getControl(KNOB_1);
// { name: 'KNOB_1', type: 'continuous', hasLed: false }
```

The `type` property is either `'continuous'` (sliders and knobs) or `'momentary'` / `'toggle'` (buttons).