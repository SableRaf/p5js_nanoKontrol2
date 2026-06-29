# p5.nanokontrol2 API Reference

## Constructor

```js
nano = new NanoKontrol2()
```
You can also pass an options object:

```js
nano = new NanoKontrol2({ debugLogs: true })
```

| Option | Type | Default | Description |
|---|---|---|---|
| `debugLogs` | `boolean` | `false` | Log raw MIDI events and lifecycle messages to the console. |
| `statusLabel` | `boolean` | `false` | Inject an on-screen connection status banner. No HTML or CSS needed — the library creates and updates it from the connection lifecycle (connected / not found / lost / WebMIDI unsupported). |
| `defaultValue` | `number` | `0` | Normalized 0..1 fallback value returned before any input arrives. |
| `onReady` | `function` | — | Called once the device is connected and the startup LED sequence finishes. |

---

## Control names

Controls are referenced by ALL_CAPS string constants, exposed as p5 globals.

- **Sliders & knobs:** `SLIDER_1` to `SLIDER_8`, `KNOB_1` to `KNOB_8`
- **Parameter buttons:** `SOLO_1` to `SOLO_8`, `MUTE_1` to `MUTE_8`, `REC_1` to `REC_8`
- **Transport buttons:** `PLAY`, `STOP`, `REW`, `FF`, `REC`, `CYCLE`
- **Function buttons:** `PREV_TRACK`, `NEXT_TRACK`, `SET_MARKER`, `PREV_MARKER`, `NEXT_MARKER`

---

## Events

Define these as global functions. The library calls them automatically and passes the triggering control's name as the first argument. Reading `nano.input.name` still works for existing sketches.

### `controlChanged(control)`

Called whenever a knob or slider moves. When smoothing is enabled, it is also re-fired each frame while the value is settling toward its target.

```js
function controlChanged(control) {
  if (control === KNOB_1) hue = nano.getValue(KNOB_1) * 360;
  if (control === SLIDER_1) radius = nano.getValue(SLIDER_1);
}
```

### `buttonPressed(btn)`

Called once when a button is pressed.

```js
function buttonPressed(btn) {
  if (btn === PLAY) playing = true;
  if (btn === STOP) playing = false;
  if (btn === REC_2) recording = true;
}
```

### `buttonReleased(btn)`

Called once when a button is released.

```js
function buttonReleased(btn) {
  if (btn === REC_1) recording = false;
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

## Properties

### `nano.input`

The last-triggered control, as an object `{ name, type, hasLed }`. Use it inside event callbacks to identify which control was triggered. The callback argument (`btn` / `control`) is usually more convenient, but this remains available.

```js
function controlChanged(control) {
  if (control === KNOB_1) hue = nano.getValue(KNOB_1) * 360;
}
```

### `nano.value`

The value of the last-triggered control, set before each event callback fires.

- For sliders and knobs: `0..1` (normalized), or `0..127` in [RAW mode](#valuemode).
- For buttons: `1` on press, `0` on release.

### `nano.isConnected`

`true` when a MIDI output port for the device is available.

---

## Methods

### `getValue(name, options?)`

Read a control's current value by name, without waiting for an event. Ideal in `draw()`.

```js
nano.getValue(SLIDER_1);                        // 0..1 (smoothed if enabled)
nano.getValue(SLIDER_1, { smoothed: false });   // immediate target value
nano.getValue(SLIDER_1, { defaultValue: 0.5 }); // 0.5 before first touch
```

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultValue` | `number` (0–1) | `0` | Returned for a control that has not yet received any message instead of snapping to zero on first touch. |
| `smoothed` | `boolean` | `true` | When `false`, returns the immediate target value, bypassing smoothing. |

Returns `0..1` by default, or `0..127` in [RAW mode](#valuemode).

---

### `isPressed(name)`

Returns `true` while the named button is physically held down, `false` otherwise. Mirrors the raw momentary signal. Returns `false` for a button that has not yet been touched.

```js
function draw() {
  if (nano.isPressed(REC_2)) cursor(HAND);
}
```

---

### `isToggled(name)`

Returns the latched state of a button: `true`/`false`, flipping on each press and persisting until the next press. Library-maintained, so it works regardless of the hardware's momentary signal. Returns `false` for a button that has not yet been touched.

```js
function draw() {
  if (nano.isToggled(MUTE_1)) drawMutedTrack(1);
}
```

---

### `setType(name, type)`

Change a button's behavior at runtime, switching between `'momentary'`, `'toggle'`, and `'radio'`. A `'momentary'` button is active only while held; a `'toggle'` button flips its latched state on each press (the state read by [`isToggled`](#istoggledname)). `name` accepts a single control or an array of controls. Sliders and knobs are continuous and are not affected.

```js
nano.setType(REC_1, 'momentary');         // REC_1 is active only while held
nano.setType(SOLO_3, 'toggle');           // SOLO_3 latches on each press
nano.setType([REC_1, REC_2], 'toggle');   // set several at once
```

**Radio groups.** Passing an array with `'radio'` makes the buttons mutually exclusive: only one is active at a time, and pressing one deactivates the rest — like radio buttons. The grouping is defined by the buttons passed in a single call. Because it is inherently a group behavior, `'radio'` requires an array of two or more controls. Read the active member with [`isToggled`](#istoggledname) (exactly one returns `true`).

```js
nano.setType([SOLO_1, SOLO_2, SOLO_3], 'radio');  // only one SOLO active at a time
```

By default the button's LED follows its type automatically: a `'toggle'` button lights its LED to match its latched state, a `'momentary'` button lights only while held, and in a `'radio'` group only the active button's LED is lit — so you don't have to manage LEDs yourself. Calling [`setLed`](#setledname-on) on a button takes over its LED manually and stops the automatic behavior for that button.

---

<a id="valuemode"></a>
### `valueMode(mode)` / `valueMode(name, mode)`

Switch a control between normalized and raw value ranges. Applies globally when no control is named, or to a single control when one is.

```js
nano.valueMode(RAW);          // all controls report 0..127
nano.valueMode(NORMALIZED);   // all controls report 0..1 (default)
nano.valueMode(KNOB_1, RAW);  // only KNOB_1 reports 0..127
```

---

### `setRange(name, min, max)`

Map a control's value to a custom range. The control's full travel is scaled to span `min`..`max`, so reads via `getValue` (and the value in `controlChanged`) come back already in that range.

```js
nano.setRange(KNOB_1, 0, 255);    // KNOB_1 reports 0..255
nano.setRange(SLIDER_1, -1, 1);   // SLIDER_1 reports -1..1
```

A custom range overrides the `NORMALIZED`/`RAW` mode for that control. Clear it by passing the control back through `valueMode(name, NORMALIZED)` or `valueMode(name, RAW)`.

---

### `setSmooth(name, easing, [duration])`

Configure value smoothing for one or more controls. Smoothing interpolates values toward their target each frame, removing jitter and creating gradual transitions. It runs automatically via a `predraw` hook. To set smoothing for all controls at once, use [`smoothMode`](#smoothmode).

`duration` (ms) is optional and defaults to `150` — the time to reach ~95% of the target value (assumes 60 fps). `name` may be a single control or an array of controls.

```js
// Single control
nano.setSmooth(SLIDER_1, 'easeOut', 500);

// Default duration
nano.setSmooth(SLIDER_1, 'lerp');

// Multiple controls
nano.setSmooth([SLIDER_1, SLIDER_2], 'easeIn', 300);
```

**Easing types:** `'lerp'`, `'easeIn'`, `'easeOut'`, `'easeInOut'`

Pass a boolean to turn smoothing on or off for a control while keeping the global setting. Per-control settings take precedence over the global setting.

```js
nano.setSmooth(KNOB_1, false);  // disable for one control
nano.setSmooth(KNOB_1, true);   // re-enable it
```

---

<a id="smoothmode"></a>
### `smoothMode(easing, [duration])`

Set smoothing globally, for all controls. Same `easing` and optional `duration` (defaults to `150` ms) as `setSmooth`. Per-control settings made with `setSmooth` take precedence.

```js
nano.smoothMode('easeInOut', 200);  // all controls smooth with easeInOut over 200ms
nano.smoothMode('lerp');            // default duration
```

**Easing types:** `'lerp'`, `'easeIn'`, `'easeOut'`, `'easeInOut'`

Pass a boolean to turn smoothing on or off globally.

```js
nano.smoothMode(false);  // disable smoothing globally
nano.smoothMode(true);   // re-enable globally
```

---

### `setLed(name, on)`

Turn a button LED on or off. `name` accepts a single control or an array of controls, all set to the same state.

```js
nano.setLed(PLAY, true);                      // turn PLAY LED on
nano.setLed(STOP, false);                     // turn STOP LED off
nano.setLed(SOLO_1, true);                    // works for any named button
nano.setLed([SOLO_1, REC_1, MUTE_1], true);   // set several at once
```

> [!IMPORTANT]
> External LED control only works when the nanoKONTROL2's **LED Mode is set to "External"**: download and open the [KORG KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/), go to the Control tab, select "Common", and set LED Mode to "External".

Function buttons (`PREV_TRACK`, `NEXT_TRACK`, `SET_MARKER`, `PREV_MARKER`, `NEXT_MARKER`) have no LEDs and are silently ignored.

Calling `setLed` on a button takes over its LED manually, stopping the automatic type-driven behavior described under [`setType`](#settypename-type) for that button.

---

### `setAllLeds(on)`

Turn all button LEDs on or off at once.

```js
nano.setAllLeds(true);   // all LEDs on
nano.setAllLeds(false);  // all LEDs off
```

---

### `statusLabel(on)`

Show or hide the on-screen connection status banner at runtime. The banner is created and updated by the library from the connection lifecycle (connected / not found / lost / WebMIDI unsupported) — no HTML or CSS needed. This toggles the same banner as the [`statusLabel` constructor option](#constructor).

```js
nano.statusLabel(true);   // show the status banner
nano.statusLabel(false);  // hide it
```

---

### `getControl(name)`

Returns the control metadata object `{ name, type, hasLed }` for a given constant, or `undefined` if the name is not recognized.

```js
const ctrl = nano.getControl(KNOB_1);
// { name: 'KNOB_1', type: 'continuous', hasLed: false }
```

The `type` property is either `'continuous'` (sliders and knobs) or `'momentary'` / `'toggle'` (buttons).