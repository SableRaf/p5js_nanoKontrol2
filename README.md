# p5.nanokontrol2

A [p5.js](https://p5js.org/) addon library for the Korg nanoKONTROL2, built on [WebMidi.js v3](https://webmidijs.org/). Knob and slider moves arrive through an `inputChanged()` callback, button presses through `buttonPressed()` / `buttonReleased()`, and the most recent input is exposed on a `midi` object as `midi.input` and `midi.value`.

## Setup

Include the library after p5.js, then create a `NanoKontrol2` in `setup()`:

```html
<script src="https://cdn.jsdelivr.net/npm/webmidi@3/dist/iife/webmidi.iife.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5@2.3.0/lib/p5.min.js"></script>
<script src="p5.nanokontrol2.js"></script>
<script src="sketch.js"></script>
```

```js
let midi;

function setup() {
  createCanvas(windowWidth, windowHeight);
  midi = new NanoKontrol2();
}
```

Open `index.html` in a browser that supports Web MIDI (Chrome recommended) and grant MIDI access when prompted. The device is discovered automatically, including hot-plugging.

## Control names

Controls are referenced by ALL_CAPS constants, exposed as p5 globals.

### Sliders & knobs
`SLIDER_1`–`SLIDER_8`, `KNOB_1`–`KNOB_8`

### Parameter buttons
`SOLO_1`–`SOLO_8`, `MUTE_1`–`MUTE_8`, `REC_1`–`REC_8`

### Transport buttons
`PLAY`, `STOP`, `REW`, `FF`, `REC`, `CYCLE`

### Function buttons
`PREV_TRACK`, `NEXT_TRACK`, `SET_MARKER`, `PREV_MARKER`, `NEXT_MARKER`

---

## API

### Constructor

```js
new NanoKontrol2({ debugLogs })
```

| Option | Type | Default | Description |
|---|---|---|---|
| `debugLogs` | `boolean` | `false` | Log raw MIDI events, port connect/disconnect, and a predraw heartbeat to the console. |

```js
midi = new NanoKontrol2({ debugLogs: true });
```

---

### State

The most recently triggered control is exposed on the instance:

```js
midi.input  // the constant of the last control touched, e.g. KNOB_1, PLAY
midi.value  // 0..1 for knobs/sliders; 1 (pressed) / 0 (released) for buttons
```

---

### Events

Define these as global functions; the library calls them for you.

#### `inputChanged()`

Called whenever a knob or slider moves. When smoothing is enabled it is also re-fired each frame while the control settles toward its target.

```js
function inputChanged() {
  if (midi.input === KNOB_1) hue = midi.value * 360;
  if (midi.input === SLIDER_1) radius = midi.value;
}
```

#### `buttonPressed()`

Called once when a button is pressed.

```js
function buttonPressed() {
  if (midi.input === PLAY) playing = true;
  if (midi.input === STOP) playing = false;
}
```

#### `buttonReleased()`

Called once when a button is released.

```js
function buttonReleased() {
  if (midi.input === REC_1) recording = false;
}
```

---

### Reading values directly

In addition to the event-driven `midi.value`, you can poll any control by name:

#### `getValue(name, { defaultValue, smoothed })`

```js
midi.getValue(SLIDER_1);                       // 0..1 (smoothed if enabled)
midi.getValue(SLIDER_1, { smoothed: false });  // immediate target value
midi.getValue(SLIDER_1, { defaultValue: 0.5 }); // 0.5 before first touch
```

- Returns `0..1` by default, or `0..127` when the control is in [RAW mode](#input-mode).
- `defaultValue` (0–1) is returned for a control that has not yet received a message — useful to avoid a snap from zero on first touch.
- `smoothed` — `true` (default) returns the smoothed value when smoothing is enabled; `false` returns the immediate target.

---

### Input mode

Values are normalized to `0..1` by default. Switch to raw `0..127` MIDI values globally or per control:

```js
midi.inputMode(RAW);          // all controls report 0..127
midi.inputMode(KNOB_1, RAW);  // only KNOB_1 reports 0..127
```

---

### Smoothing

Smoothing interpolates values toward their target each frame, removing jitter and creating gradual transitions. It runs automatically via a `predraw` lifecycle hook — **you do not need to call anything in `draw()`.** Both `midi.value` (in `inputChanged`) and `getValue()` reflect the smoothed value while it is active.

#### `setSmooth({ inputName, enabled, easingType, duration })`

| Option | Type | Default | Description |
|---|---|---|---|
| `inputName` | `string` or `string[]` | — | Control(s) to configure. Omit to set globally. |
| `enabled` | `boolean` | `true` | Turn smoothing on or off. |
| `easingType` | `string` | `'lerp'` | Shape of the interpolation curve (see below). |
| `duration` | `number` (ms) | `150` | Time to reach ~95% of the target value (assumes 60 fps). |

```js
// Global — applies to all controls
midi.setSmooth({ enabled: true, easingType: 'easeOut', duration: 200 });

// Single control
midi.setSmooth({ inputName: SLIDER_1, duration: 500 });

// Multiple controls
midi.setSmooth({ inputName: [SLIDER_1, SLIDER_2], easingType: 'easeIn', duration: 300 });

// Disable smoothing for one control while keeping it globally
midi.setSmooth({ inputName: KNOB_1, enabled: false });
```

Per-input settings take precedence over the global setting.

**Easing types**

| Name | Shape |
|---|---|
| `lerp` | Constant speed (linear interpolation) |
| `easeIn` | Starts slow, ends fast |
| `easeOut` | Starts fast, ends slow |
| `easeInOut` | Slow at both ends |

---

### Controlling LEDs

The nanoKONTROL2 can drive its button LEDs from the host when set to **External LED Control** mode.

**Enable External LED Control mode:** hold the **CYCLE** button while plugging in the USB cable. Alternatively, use the [KORG KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/) and set LED Mode to "External". In the default "Internal" mode the unit drives its own LEDs and ignores `setLed()`.

#### `setLed(name, on)`

```js
midi.setLed(PLAY, true);   // turn PLAY LED on
midi.setLed(STOP, false);  // turn STOP LED off
midi.setLed(SOLO_1, true); // works for any named button
```

`name` must be one of the button constants. Sliders and knobs have no LEDs and are silently ignored.

---

## Minimal sketch

```js
let midi;
let hue = 0;
let playing = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);

  midi = new NanoKontrol2();
  midi.setSmooth({ enabled: true, easingType: 'easeOut', duration: 200 });
}

function draw() {
  // No interpolate() call needed — smoothing runs automatically.
  background(hue, 100, playing ? 100 : 40);
}

function inputChanged() {
  if (midi.input === KNOB_1) hue = midi.value * 360;
}

function buttonPressed() {
  if (midi.input === PLAY) { playing = true; midi.setLed(PLAY, true); }
  if (midi.input === STOP) { playing = false; midi.setLed(PLAY, false); }
}
```
