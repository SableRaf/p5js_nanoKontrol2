# Migration to the new p5.nanokontrol2 API

## Context

`API_update.md` defines the next iteration of the public API for the `p5.nanokontrol2`
library. It is a substantial expansion over the current `API.md`/implementation:
runtime button typing (momentary/toggle/radio) with library-managed state and
automatic LED behavior, per-control value ranges, a cleaner smoothing API, and
event callbacks that receive the triggering control's name as an argument.

The goal is to make the implementation in `src/`, the examples, and the docs match
`API_update.md`, then rebuild the `dist/` bundles and regenerated type declarations.

**Decisions made with the user:**
- **Hard rename of callbacks** — `controlChanged(control)`, `buttonPressed(btn)`,
  `buttonReleased(btn)`. The old no-arg `inputChanged()` is dropped. `nano.input` /
  `nano.value` properties are *kept* as runtime state, but their metadata-object framing is
  undocumented (see decision 5); the engine no longer dispatches the old `inputChanged`
  name. The documented way to identify a control is the bare-string callback arg
  (`ctrl === KNOB_1`, or `ctrl === SLIDER_${i+1}` for the iteration idiom). The callback
  arg is always a canonical bare string, so no name-lookup accessor is needed.
- **All buttons default to `momentary`** — toggle/radio is opt-in via `setType()`.
  SOLO/MUTE/REC are retyped from `toggle` to `momentary` in the device definition.
- **Full migration in one pass** — engine + examples + README + API.md + types + build.

The doc uses `nano` as the instance variable name (vs the current `midi`); this is
just convention in examples, not an API requirement. Examples will be updated to
`nano` for consistency with the new docs.

### Resolved spec decisions (from review)

These close behaviors the docs left unstated; they must land in **both** `API.md` and
`MidiController.ts` so docs and implementation don't drift:

1. **Invalid `'radio'`** — `setType(name, 'radio')` on a single control or an array of
   fewer than 2 → `console.warn` and ignore (no type change applied). Suggested text:
   `"setType: 'radio' requires an array of 2 or more controls; ignoring"`.
2. **Global `valueMode` clears ranges** — a global `valueMode(RAW | NORMALIZED)` clears
   per-control custom ranges set *before* the call (falls out of iterating and clearing
   the current `_range` entries; no timestamping). Ranges set afterward survive.
3. **Internal LED mode** — auto-LED for toggle/radio is a no-op when the device is in
   default (Internal) LED mode, with no runtime notice. Already covered by the existing
   External-LED-mode requirement under `setLed`; no code or doc change needed.
4. **Version** — target `0.2.0` (minor bump; correct semver for a breaking 0.x release).
   README CDN pin updates `@0.1.2` → `@0.2.0`.
5. **Drop the metadata-object pattern; idiomatic accessors instead** — the old
   `getControl(name)` → `{ name, type, hasLed }` and the documented `nano.input` object are
   removed from the public API. **`getControl` is removed** (engine + docs) and replaced by
   two idiomatic string accessors that mirror p5's `name(arg)` style, each taking a
   control-name string:
   - **`getType(name)`** — the **live runtime type**: the value last set by `setType`,
     defaulting to `'momentary'` for buttons and `'continuous'` for sliders/knobs (return
     set `'continuous' | 'momentary' | 'toggle' | 'radio'`); `undefined` for unknown names.
   - **`hasLed(name)`** — boolean; replaces the old `hasLed` metadata field.
   No name-lookup accessor is provided: callback arguments are already **canonical bare
   strings** (`controlChanged(ctrl)` with `ctrl === KNOB_1`, or `ctrl === \`SLIDER_${i+1}\``
   for the iteration idiom), unchanged from `API_update.md`, so a `getName`/`isControl`-style
   helper would be redundant. `nano.input` keeps existing as a runtime object but its
   `{ name, type, hasLed }` framing is **dropped from the docs** (see §8) — its reads are now
   served by the two accessors.
6. **Auto-LED on momentary is a NEW behavior for previously-inert buttons** — with all
   buttons defaulting to `'momentary'`, the auto-LED rule "`'momentary'` lights while held"
   now drives LEDs for **transport buttons (`PLAY`/`STOP`/`REW`/`FF`/`REC`/`CYCLE`) and the
   retyped SOLO/MUTE/REC on press**, which today do nothing on press. This is intended and
   matches `API_update.md` ([line 179](API_update.md#L179)), but it is a visible runtime
   change in External LED mode. (No effect in default
   Internal LED mode per decision 3.)

---

## API delta (current → new)

| Area | Current | New |
|---|---|---|
| Continuous callback | `inputChanged()` (no arg) | `controlChanged(control)` |
| Button callbacks | `buttonPressed()` / `buttonReleased()` (no arg) | same names, `(btn)` arg |
| Value mode | `inputMode(mode)` / `inputMode(name, mode)` | rename to `valueMode(mode)` / `valueMode(name, mode)`; `NORMALIZED` is a new *constant* (not a method form) |
| Smoothing | `setSmooth({options})` | `setSmooth(name, easing, [duration])` — per-control only, incl. boolean form `setSmooth(name, false)`. New `smoothMode(easing, [dur])` / `smoothMode(true|false)` is the *only* global form |
| Button type | baked in device def | runtime `setType(name, 'momentary'|'toggle'|'radio')`, arrays, radio groups; read back via `getType(name)` |
| Toggle/press state | sketch-tracked | `isToggled(name)`, `isPressed(name)` library-tracked |
| Control metadata | `getControl(name)` → `{ name, type, hasLed }` | **`getControl` removed**; replaced by idiomatic string accessors `getType(name)` and `hasLed(name)`. No name-lookup accessor — callback args are already canonical bare strings (`ctrl === KNOB_1`, or `ctrl === \`SLIDER_${i+1}\`` for the iteration idiom). |
| Ranges | none | `setRange(name, min, max)` |
| LEDs | `setLed(name, on)` single | `setLed(name|name[], on)`; auto LED driven by type |
| Status banner | constructor option only | + runtime `statusLabel(on)` |

---

## Implementation

### 1. Types — `src/types.ts`
- Add `'radio'` to a button-type union usable at runtime. Keep `ControlType`
  (`'continuous' | 'momentary' | 'toggle'`) for device-def authoring; introduce a
  `ButtonType = 'momentary' | 'toggle' | 'radio'` for `setType`.
- `NORMALIZED` constant type. Add `setRange` bookkeeping types.
- Replace `SetSmoothOptions` object-shape with the new positional signature (or keep
  the internal `SmoothConfig`, drop the public `SetSmoothOptions` object form). When
  dropping it, also remove its import in `MidiController.ts` ([line 11](src/MidiController.ts#L11))
  or the build fails to typecheck.
- `MidiControllerOptions` unchanged (`debugLogs`, `statusLabel`, `defaultValue`,
  `onReady`).

### 2. Constants — `src/constants.ts`
- Add `export const NORMALIZED = 'NORMALIZED';` alongside `RAW`.
- Add button-type string constants only if we want them as globals; the docs use
  bare string literals (`'toggle'`), so **no new globals needed** beyond `NORMALIZED`.

### 3. Device definition — `src/devices/nanokontrol2.device.ts`
- Change `type: 'toggle'` → `type: 'momentary'` for all `SOLO_*`, `MUTE_*`, `REC_*`
  (lines 36–61). Keep `hasLed: true`. This makes momentary the universal button
  default; toggle/radio becomes opt-in.

### 4. Engine — `src/MidiController.ts` (the bulk of the work)
Reuse existing `_ccMap`, `_nameToCC`, `_values`, `_prevValues`, `_smoothed`,
`_rawMode`/`_rawGlobal`, `_smooth`/`_smoothPerName`, `EASING`/`durationToSpeed`.

- **Callback dispatch** (`_dispatchAction`, lines 251–260): pass the control name as
  the first argument: `this._p5[name](controlName)` / `window[name](controlName)`.
  Rename the dispatched continuous action from `'inputChanged'` to `'controlChanged'`
  (update both call sites: `_update` line 191, `_interpolate` line 229). Keep setting
  `this.input` / `this.value` before each dispatch.
- **Per-button runtime type state**: add `_buttonType: Record<name,'momentary'|'toggle'|'radio'>`
  defaulting from the (now momentary) device def. Add `_toggled: Record<name,boolean>`
  and `_pressed: Record<name,boolean>`.
- **`_update` for buttons** (lines 192–200): on press, set `_pressed=true`; if type is
  `'toggle'` flip `_toggled`; if `'radio'` set this member true and clear group peers;
  drive auto-LED unless `setLed` has taken over (see `_ledManual` flag). Still fire
  `buttonPressed(name)` on press and `buttonReleased(name)` on release; keep
  `_pressed=false` on release.
- **`setType(name|name[], type)`**: record type for each; create a radio group keyed by
  the array members. Sliders/knobs ignored. **`'radio'` requires an array of ≥2** — an
  invalid call `console.warn`s (`"setType: 'radio' requires an array of 2 or more
  controls; ignoring"`) and returns without mutating any button type.
- **`isPressed(name)` / `isToggled(name)`**: return tracked booleans, default `false`.
- **Remove `getControl`; add two string accessors** (decision 5). Delete
  `getControl(name)` ([MidiController.ts:86–89](src/MidiController.ts#L86-L89)) — confirmed
  it has **no internal or example callers** (grep: only the definition exists), so removal
  is clean. Add:
  - **`getType(name)`**: live `_buttonType[name]` for buttons (default `'momentary'`),
    `'continuous'` for sliders/knobs, `undefined` for unknown names.
  - **`hasLed(name)`**: the control's `hasLed` boolean; `undefined` for unknown names.
- **`valueMode(...)`**: rename `inputMode`; accept `RAW`/`NORMALIZED` (NORMALIZED clears
  raw for that scope). Keep both global and per-control forms.
- **`setRange(name, min, max)`**: store `_range[name]={min,max}`; in `getValue`, when a
  range exists, map normalized 0..1 → min..max (range overrides RAW/NORMALIZED).
  `valueMode(name, ...)` clears that control's range; a **global** `valueMode(RAW |
  NORMALIZED)` clears all existing `_range` entries (the pre-existing ones only, by
  construction). Document this rather than resolving it ad hoc.
- **`setSmooth(name, easing, [duration])`**: new positional signature; also accept a
  boolean (`setSmooth(name, false)`) to toggle enabled while keeping other settings;
  `name` may be array. Add **`smoothMode(easing, [duration])`** + boolean form for the
  global config (replaces the old object-form global path).
- **`setLed(name|name[], on)`**: accept arrays; mark `_ledManual[name]=true` so auto
  type-driven LED stops for that button (per docs).
- **`statusLabel(on)`**: create the `StatusBanner` lazily if needed and show/hide it at
  runtime; reflect current connection state. Reuse `StatusBanner`’s `connected()` /
  `disconnected()` / `noWebMidi()`.
- **Auto-LED on type**: a `'toggle'` lights to match `_toggled`; `'momentary'` lights
  while held; `'radio'` lights only the active member — all skipped when `_ledManual`.
  ⚠️ Since every button now defaults to `'momentary'`, "lights while held" drives LEDs
  for transport + retyped SOLO/MUTE/REC on press, which is **new behavior** vs. today
  (see resolved decision 6). External LED mode only. Confirm intended before shipping.
  The `_ledStartupSequence` predicate ([lines 318–320](src/MidiController.ts#L318-L320))
  and the constructor `hasLed` default ([line 65](src/MidiController.ts#L65)) both filter
  on `momentary`/`toggle`; retyping SOLO/MUTE/REC `toggle`→`momentary` keeps them matching,
  so LED eligibility and the startup flash are unaffected — verified, no change needed.

### 5. Addon registration — `src/addon.ts`
- Expose `NORMALIZED` as a p5 global (`fn.NORMALIZED = NORMALIZED;`) next to `fn.RAW`
  (line 12).
- No change to control-name global generation or the `predraw` smoothing hook.

### 6. Type generation — `scripts/gen-types.js` + `src/globals.d.ts`
- Ensure generated `dist/types/*.d.ts` includes `const NORMALIZED: string;` and the
  new method signatures (`setType`, `getType`, `hasLed`, `isPressed`,
  `isToggled`, `setRange`, `valueMode`, `smoothMode`, `statusLabel`, array-accepting
  `setLed`), and **drops `getControl`** from any declared method surface.
- Update the **stale callback name in the generated header**: the template string at
  [gen-types.js:30](scripts/gen-types.js#L30) hardcodes
  `The inputChanged/buttonPressed/buttonReleased callbacks…`; rename `inputChanged` →
  `controlChanged` so the emitted `.d.ts` comment doesn't drift after the callback rename.
- Control-name extraction is unaffected by the rename: [gen-types.js:16](scripts/gen-types.js#L16)
  reads `c.name` off the bundled `NANOKONTROL2_DEF` and the callback rename doesn't touch
  the device def — confirm the build still emits all 39 constants.

### 7. Examples — `examples/**`
Update instance name `midi` → `nano` and the API surface:
- `basic/slider/sketch.js`: `inputChanged()` → `controlChanged(control)`, compare the
  `control` arg instead of `midi.input.name`.
- `basic/button/sketch.js`: `buttonPressed()` → `buttonPressed(btn)`.
- `basic/leds/sketch.js`: `buttonPressed(btn)`; array `setLed` optional.
- `demos/characters/sketch.js`: `controlChanged(control)` / `buttonPressed(btn)` /
  `buttonReleased(btn)`; `onReady` LED call unchanged.
- `demos/digitalTwin/sketch.js`: **biggest change** — replace the hand-rolled
  `TOGGLE_STATES` map and manual toggle/LED mirroring with `setType` in setup and read
  `isToggled(name)` instead of the local map. Use **`'radio'` for the SOLO group** and
  **`'toggle'` for MUTE/REC** — matches common DAW semantics (solo is mutually exclusive)
  and exercises both the radio and toggle paths, making the demo double as documentation.
  Remove `syncLedToggledStates`/`resetToggleStates` now handled by the library’s
  auto-LED. `controlChanged(control)` replaces `inputChanged()`. `NanoKontrolUI.js` needs
  no API changes.
- `index.html` files: no change (CDN script tags), unless we bump the pinned
  `p5.nanokontrol2@0.1.2` version after release.

### 8. Docs
- Replace `API.md` content with `API_update.md` (or rename `API_update.md` → `API.md`).
- **Add the resolved behaviors to `API.md`** so docs match the implementation:
  - Under **`setRange`**: a global `valueMode(RAW | NORMALIZED)` *also* clears existing
    custom ranges, in addition to the per-control `valueMode(name, ...)` clear already
    documented.
  - Under **`setType`**: `'radio'` requires an array of 2+ controls; an invalid call
    warns and is ignored.
  - **Remove the `getControl` section** (decision 5) and replace it with two accessor
    sections, each taking a control-name string:
    - **`getType(name)`** → live runtime type (`'continuous'` for sliders/knobs;
      `'momentary'` | `'toggle'` | `'radio'` for buttons, reflecting the last `setType`,
      default `'momentary'`). Example: `nano.setType(SOLO_1, 'radio'); nano.getType(SOLO_1); // 'radio'`.
    - **`hasLed(name)`** → boolean (replaces the old `hasLed` metadata field; function
      buttons return `false`).
    Note there is **no name-lookup accessor**: callback args are already canonical bare
    strings, so the iteration idiom is a direct comparison
    `if (ctrl === \`SLIDER_${i+1}\`) { ... }`.
  - **Drop the metadata-object framing from `nano.input`** ([API_update.md line 97](API_update.md#L97)):
    remove the `{ name, type, hasLed }` description. `nano.input` / `nano.value` stay
    mentioned as "last-triggered control" state, but type/LED reads route through the new
    accessors. Callback examples keep the bare-string comparison (`ctrl === KNOB_1`) — no
    change to the `controlChanged` / `buttonPressed` / `buttonReleased` examples.
  - **State the momentary default** where `setType` is introduced: all buttons are
    `'momentary'` until `setType` changes them; toggle/radio are opt-in.
- Update `README.md` Quick start / Minimal example to the new callback-arg style and
  `nano` naming, and **document the "all buttons default to momentary" assumption** (per the
  user's request): a short note that buttons fire press/release momentarily and become
  latching (`'toggle'`) or mutually-exclusive (`'radio'`) only via `setType`.

### 9. Build & version
- Set `package.json` version to **`0.2.0`** (minor bump; correct semver for a breaking
  0.x release). Both `package.json` and the README pin are currently `0.1.2` (confirmed).
  Update the README CDN pin at [README.md:24](README.md#L24) `@0.1.2` → `@0.2.0`.
- `npm run build` (prod + dev + types).

---

## Verification

1. **Typecheck/build**: `npm run typecheck` then `npm run build` — must produce
   `dist/p5.nanokontrol2.js`, `.min.js`, and `dist/types/*` with the new method
   signatures and `NORMALIZED`.
2. **Static check of examples**: confirm no remaining references to `inputChanged`,
   `midi.input`, or `getControl` anywhere in `src/`, `examples/`, `README.md`, and the
   generated `dist/types/*` (grep), and that `controlChanged`/`(btn)` args are
   used.
3. **Manual device test** (the project’s real verification path — the library talks to
   physical hardware): serve an example (`examples/demos/digitalTwin/`) against the
   freshly built `dist/`, plug in a nanoKONTROL2 in CC mode with External LED mode, and
   confirm:
   - Knobs/sliders fire `controlChanged(control)` with the right name; `getValue`,
     `setRange`, `valueMode(RAW/NORMALIZED)`, and smoothing (`setSmooth`/`smoothMode`)
     behave.
   - `setType([...], 'toggle')` latches and auto-drives LEDs; `isToggled` reflects it.
   - `setType([...], 'radio')` enforces single-active with correct LEDs.
   - `isPressed` is true only while held; `buttonPressed(btn)`/`buttonReleased(btn)`
     receive the name.
   - `setLed` array form, `setAllLeds`, and runtime `statusLabel(true/false)` work; the
     manual `setLed` override stops auto-LED for that button.
   - The startup LED sequence still runs and `onReady` fires.
4. **Regression**: the `digitalTwin` demo should behave the same as before (toggle
   LEDs mirrored) now that the library manages state instead of `TOGGLE_STATES`.

(If no hardware is available during implementation, stop after steps 1–2 and flag that
hardware verification is pending — the engine’s button-state/LED logic cannot be fully
exercised without the device.)
