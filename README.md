# p5.js + nanoKONTROL2

A minimal boilerplate for using the Korg nanoKONTROL2 with p5.js via WebMidi.js v3.

## Setup

Open `index.html` in a browser that supports Web MIDI. Grant MIDI access when prompted. Move any control on the nanoKONTROL2 and it will be available immediately in `draw()`.

## Control names

### Faders & knobs
`fader1`–`fader8`, `knob1`–`knob8`

### Buttons (per channel)
`solo1`–`solo8`, `mute1`–`mute8`, `rec1`–`rec8`

### Transport
`play`, `stop`, `rw`, `ff`, `rec`, `cycle`, `prevTrk`, `nextTrk`, `setMrk`, `prevMrk`, `nextMrk`

---

## API

### Constructor

```js
new MidiMapper(ccToName, { defaultValue = 0 })
```

`defaultValue` (0–1) is returned by `getValue()` for any control that has not yet received a MIDI message. Useful to avoid a snap from zero on first touch.

```js
const nano = new MidiMapper(CC_MAP, { defaultValue: 0.5 });
```

---

### Reading values

#### `getValue(name, { normalize, defaultValue })`

Returns the current value of a slider or knob.

- `normalize` — `true` (default) returns `0..1`; `false` returns the raw `0..127` byte.
- `defaultValue` — per-call override of the global default, for controls that should start somewhere other than zero.

```js
nano.getValue('fader1');                          // 0..1
nano.getValue('fader1', { normalize: false });    // 0..127
nano.getValue('fader1', { defaultValue: 0.5 });  // starts at 0.5 before first touch
```

When smoothing is enabled for a control, `getValue()` returns the smoothed value automatically — no separate method needed.

#### `getRaw(name, { defaultValue })`

Same as `getValue` with `normalize: false`. Useful internally or when you need the raw byte directly.

---

### Reading buttons

#### `getButtonPressed(name)`

`true` as long as the button is held down.

```js
if (nano.getButtonPressed('play')) playing = true;
```

#### `isPressed(name)`

`true` only on the single frame the button transitions from released → pressed.

```js
if (nano.isPressed('solo1')) { /* fires once per press */ }
```

#### `isReleased(name)`

`true` only on the single frame the button transitions from pressed → released.

---

### Smoothing

Smoothing interpolates values toward their target each frame, removing jitter and creating gradual transitions. `getValue()` returns the smoothed value automatically when smoothing is active.

#### `setSmooth({ for, enabled, easingType, duration })`

| Option | Type | Default | Description |
|---|---|---|---|
| `for` | `string` or `string[]` | — | Name(s) to configure. Omit to set globally. |
| `enabled` | `boolean` | `true` | Turn smoothing on or off. |
| `easingType` | `string` | `'lerp'` | Shape of the interpolation curve (see below). |
| `duration` | `number` (ms) | `150` | Time to reach ~95% of the target value (assumes 60 fps). |

```js
// Global — applies to all controls
nano.setSmooth({ enabled: true, easingType: 'easeOut', duration: 200 });

// Single control
nano.setSmooth({ for: 'fader1', duration: 500 });

// Multiple controls
nano.setSmooth({ for: ['fader1', 'fader2'], easingType: 'easeIn', duration: 300 });

// Disable smoothing for one control while keeping it globally
nano.setSmooth({ for: 'knob1', enabled: false });
```

Per-input settings take precedence over the global setting.

**Easing types**

| Name | Shape |
|---|---|
| `lerp` | Constant speed (linear interpolation) |
| `easeIn` | Starts slow, ends fast |
| `easeOut` | Starts fast, ends slow |
| `easeInOut` | Slow at both ends |

#### `interpolate()`

Advances all smoothed values by one frame. Call once at the top of `draw()` whenever smoothing is in use.

```js
function draw() {
  nano.interpolate();
  // ...
}
```

---

### Controlling LEDs

The nanoKONTROL2 can drive its button LEDs from the host when set to **External LED Control** mode.

**Enable External LED Control mode:** hold the **CYCLE** button while plugging in the USB cable. Alternatively, use the [KORG KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/) and set LED Mode to "External".

Once enabled, use `setLed()` to turn any button LED on or off by name:

#### `setLed(name, on)`

```js
setLed('play', true);   // turn play LED on
setLed('stop', false);  // turn stop LED off
setLed('solo1', true);  // works for any named button
```

`name` must be one of the button names listed under [Control names](#control-names). Faders and knobs have no LEDs and are silently ignored.

LEDs mirror the same CC numbers as their input buttons — `setLed` looks up the mapping automatically via `nano.nameToCC`, so no manual CC numbers are needed.

---

### Utilities

#### `has(name)`

`true` if at least one MIDI message has been received for that control. Useful to distinguish "untouched" from "set to zero".

```js
if (!nano.has('fader1')) {
  // controller hasn't sent anything yet
}
```

---

## Minimal sketch

```js
function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  colorMode(HSB, 360, 100, 100);

  nano.setSmooth({ enabled: true, easingType: 'easeOut', duration: 200 });
}

function draw() {
  nano.interpolate();

  const h = map(nano.getValue('knob1'), 0, 1, 0, 360);
  const s = map(nano.getValue('knob2'), 0, 1, 0, 100);
  const b = map(nano.getValue('knob3'), 0, 1, 0, 100);
  background(h, s, b);
}
```
