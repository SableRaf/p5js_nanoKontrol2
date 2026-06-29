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
| `statusLabel` | `boolean` | `false` | Inject an on-screen connection status banner. No HTML or CSS needed. The library creates and updates it from the connection lifecycle: connected, not found, lost, or WebMIDI unsupported. |
| `defaultValue` | `number` | `0` | Normalized 0..1 fallback value returned before any input arrives. |
| `onReady` | `function` | — | Called once the device is connected and the startup LED sequence finishes. |

---

## Control names

Controls are referenced by ALL_CAPS string constants, exposed as p5 globals.

- **Sliders and knobs:** `SLIDER_1` to `SLIDER_8`, `KNOB_1` to `KNOB_8`
- **Parameter buttons:** `SOLO_1` to `SOLO_8`, `MUTE_1` to `MUTE_8`, `REC_1` to `REC_8`
- **Transport buttons:** `PLAY`, `STOP`, `REW`, `FF`, `REC`, `CYCLE`
- **Function buttons:** `PREV_TRACK`, `NEXT_TRACK`, `SET_MARKER`, `PREV_MARKER`, `NEXT_MARKER`

---

## Events

Define these as global functions. The library calls them automatically and passes the triggering control's name as the first argument.

Callback arguments are canonical control-name strings, so you can compare them directly:

```js
function controlChanged(ctrl) {
  if (ctrl === KNOB_1) hue = nano.getValue(KNOB_1) * 360;

  for (let i = 0; i < 8; i++) {
    if (ctrl === `SLIDER_${i + 1}`) {
      levels[i] = nano.getValue(ctrl);
    }
  }
}
```

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

Called when the nanoKONTROL2 is connected, including on page load if it is already plugged in.

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

The last-triggered control. This is kept as runtime state for compatibility. In new sketches, prefer the callback argument:

```js
function controlChanged(control) {
  if (control === KNOB_1) hue = nano.getValue(KNOB_1) * 360;
}
```

Use [`getType(name)`](#gettypename) and [`hasLed(name)`](#hasledname) when you need control metadata.

### `nano.value`

The value of the last-triggered control, set before each event callback fires.

- For sliders and knobs: `0..1` normalized, or `0..127` in [RAW mode](#valuemode).
- For buttons: `1` on press, `0` on release.

### `nano.isConnected`

`true` when a MIDI output port for the device is available.

---

## Methods

### `getValue(name, options?)`

Read a control's current value by name, without waiting for an event. Ideal in `draw()`.

```js
nano.getValue(SLIDER_1);                        // 0..1, smoothed if enabled
nano.getValue(SLIDER_1, { smoothed: false });   // immediate target value
nano.getValue(SLIDER_1, { defaultValue: 0.5 }); // 0.5 before first touch
```

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultValue` | `number` (0–1) | `0` | Returned for a control that has not yet received any message instead of snapping to zero on first touch. |
| `smoothed` | `boolean` | `true` | When `false`, returns the immediate target value, bypassing smoothing. |

Returns `0..1` by default, or `0..127` in [RAW mode](#valuemode). If a custom range is set with [`setRange`](#setrangename-min-max), `getValue()` returns that mapped range instead.

---

### `isPressed(name)`

Returns `true` while the named button is physically held down, `false` otherwise. This mirrors the raw momentary signal. Returns `false` for a button that has not yet been touched.

```js
function draw() {
  if (nano.isPressed(REC_2)) cursor(HAND);
}
```

---

### `isToggled(name)`

Returns the library-managed latched state of a button. For a `'toggle'` button, it flips on each press. For a `'radio'` group, the active member returns `true` and the other group members return `false`.

```js
function draw() {
  if (nano.isToggled(MUTE_1)) drawMutedTrack(1);
}
```

Returns `false` for a button that has not yet been touched.

---

### `setType(name, type)`

Change a button's behavior at runtime. Buttons default to `'momentary'`. Toggle and radio behavior is opt-in.

`type` can be:

| Type | Behavior |
|---|---|
| `'momentary'` | Active only while physically held. |
| `'toggle'` | Flips its latched state on each press. Read it with [`isToggled`](#istoggledname). |
| `'radio'` | Makes a group of buttons mutually exclusive. Only one group member is active at a time. |

`name` accepts a single button or an array of buttons. Sliders and knobs are continuous and are not affected.

```js
nano.setType(REC_1, 'momentary');         // REC_1 is active only while held
nano.setType(MUTE_3, 'toggle');           // MUTE_3 latches on each press
nano.setType([MUTE_1, MUTE_2], 'toggle'); // set several at once
```

**Radio groups.** Passing an array with `'radio'` makes those buttons mutually exclusive, like radio buttons. The group is defined by the buttons passed in one call. Because this is group behavior, `'radio'` requires an array of two or more controls. Invalid calls warn and are ignored.

```js
nano.setType(
  [SOLO_1, SOLO_2, SOLO_3, SOLO_4, SOLO_5, SOLO_6, SOLO_7, SOLO_8],
  'radio'
);
```

By default, a button LED follows its type automatically:

- A `'momentary'` button lights while held.
- A `'toggle'` button lights to match its latched state.
- A `'radio'` group lights only the active member.

Calling [`setLed`](#setledname-on) on a button takes over its LED manually and stops automatic LED behavior for that button.

> [!NOTE]
> Automatic LED behavior only has a visible effect when the nanoKONTROL2 LED mode is set to External.

---

### `setToggled(name, on)`

Set the latched state of a `'toggle'` or `'radio'` button, as if it had been pressed to that state. The button's LED updates to match (unless you have taken it over with [`setLed`](#setledname-on)). Use this to seed an initial selection — for example, lighting `PLAY` at startup in a `PLAY`/`STOP` radio group, since a radio group otherwise has no active member until the first press.

`name` accepts a single button or an array of buttons.

```js
nano.setToggled(MUTE_1, true);           // latch a toggle on
nano.setToggled(PLAY, true);             // make PLAY the active radio member
nano.setToggled([MUTE_1, MUTE_2], true); // latch several at once
```

For a `'radio'` button, passing `true` activates it and deactivates its peers; passing `false` clears the whole group. The state is reflected by [`isToggled`](#istoggledname).

Calling this on a `'momentary'` button or a continuous control warns and is ignored.

---

<a id="valuemode"></a>
### `valueMode(mode)` / `valueMode(name, mode)`

Switch a control between normalized and raw value ranges. Applies globally when no control is named, or to a single control when one is.

```js
nano.valueMode(RAW);          // all controls report 0..127
nano.valueMode(NORMALIZED);   // all controls report 0..1, default
nano.valueMode(KNOB_1, RAW);  // only KNOB_1 reports 0..127
```

Passing a control through `valueMode(name, RAW)` or `valueMode(name, NORMALIZED)` clears that control's custom range. Calling `valueMode(RAW)` or `valueMode(NORMALIZED)` globally clears existing custom ranges for all controls.

---

### `setRange(name, min, max)`

Map a control's value to a custom range. The control's full travel is scaled to span `min`..`max`, so reads via `getValue()` and `nano.value` come back already in that range.

```js
nano.setRange(KNOB_1, 0, 255);    // KNOB_1 reports 0..255
nano.setRange(SLIDER_1, -1, 1);   // SLIDER_1 reports -1..1
```

A custom range overrides the `NORMALIZED` or `RAW` mode for that control.

Clear a custom range by passing the control through `valueMode(name, NORMALIZED)` or `valueMode(name, RAW)`. A global `valueMode(RAW)` or `valueMode(NORMALIZED)` call also clears existing custom ranges for all controls.

---

### `setSmooth(name, easing, [duration])`

Configure value smoothing for one or more controls. Smoothing interpolates values toward their target each frame, removing jitter and creating gradual transitions. It runs automatically via a `predraw` hook.

To set smoothing for all controls at once, use [`smoothMode`](#smoothmode).

`duration` is optional and defaults to `150` ms. It is the approximate time to reach 95% of the target value, assuming 60 fps. `name` may be a single control or an array of controls.

```js
nano.setSmooth(SLIDER_1, 'easeOut', 500);
nano.setSmooth(SLIDER_1, 'lerp');
nano.setSmooth([SLIDER_1, SLIDER_2], 'easeIn', 300);
```

**Easing types:** `'lerp'`, `'easeIn'`, `'easeOut'`, `'easeInOut'`

Pass a boolean to turn smoothing on or off for a control while keeping the rest of its smoothing configuration. Per-control settings take precedence over the global setting.

```js
nano.setSmooth(KNOB_1, false);  // disable for one control
nano.setSmooth(KNOB_1, true);   // re-enable it
```

---

<a id="smoothmode"></a>
### `smoothMode(easing, [duration])`

Set smoothing globally for all controls. Uses the same `easing` and optional `duration` as [`setSmooth`](#setsmoothname-easing-duration). Per-control settings made with `setSmooth()` take precedence.

```js
nano.smoothMode('easeInOut', 200);  // all controls smooth with easeInOut over 200 ms
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
> External LED control only works when the nanoKONTROL2's **LED Mode is set to "External"**. Download and open the [KORG KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/), go to the Control tab, select "Common", and set LED Mode to "External".

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

Show or hide the on-screen connection status banner at runtime. The banner is created and updated by the library from the connection lifecycle: connected, not found, lost, or WebMIDI unsupported. This toggles the same banner as the [`statusLabel` constructor option](#constructor).

```js
nano.statusLabel(true);   // show the status banner
nano.statusLabel(false);  // hide it
```

---

<a id="gettypename"></a>
### `getType(name)`

Returns the live runtime type of a control.

- Sliders and knobs return `'continuous'`.
- Buttons return `'momentary'`, `'toggle'`, or `'radio'`.
- Unknown names return `undefined`.

For buttons, the returned value reflects the last [`setType`](#settypename-type) call. Buttons default to `'momentary'`.

```js
nano.getType(KNOB_1); // 'continuous'

nano.setType(MUTE_1, 'toggle');
nano.getType(MUTE_1); // 'toggle'
```

---

<a id="hasledname"></a>
### `hasLed(name)`

Returns whether a control has a hardware LED.

```js
nano.hasLed(PLAY);        // true
nano.hasLed(SOLO_1);      // true
nano.hasLed(KNOB_1);      // false
nano.hasLed(PREV_TRACK);  // false
```

Unknown names return `undefined`.