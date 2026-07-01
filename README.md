> [!WARNING]
> This library is in **early development**. The API may change in the future, and some features may not work as expected. Please report any issues on [GitHub](https://github.com/SableRaf/p5js_nanoKontrol2/issues).

# p5.nanokontrol2

A p5.js addon library for the Korg nanoKONTROL2 MIDI controller.

![Layout of the nanoKONTROL2](https://raw.githubusercontent.com/SableRaf/p5js_nanoKontrol2/main/examples/demos/digitalTwin/layout.svg)

Using a physical device is a fun alternative to a mouse, keyboard, or on-screen UI. The nanoKONTROL2 has 8 sliders, 8 knobs, and 35 buttons, 30 of which have built-in LEDs. You can map these to control any variable in your p5.js sketch, the size of a shape, the speed of an animation, or the color of a background. It's all up to you!

More about the nanoKONTROL2 on the [Korg website](https://www.korg.com/us/products/computergear/nanokontrol2/).

## Try it

[Demo sketch](https://openprocessing.org/@SableRaph/2973319) (you will need a nanoKONTROL2 connected to your computer)

![Demo screenshot](https://raw.githubusercontent.com/SableRaf/p5js_nanoKontrol2/main/demo.png)

## Quick start

> [!NOTE]
> The instructions below show basic usage. For the full API docs, see [API.md](API.md).

Import webMidi.js and p5.nanokontrol2 in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/webmidi@3/dist/iife/webmidi.iife.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5.nanokontrol2@0.2.0/dist/p5.nanokontrol2.js"></script>
```

Then, in `setup()`, create a `NanoKontrol2` instance:

```js
nano = new NanoKontrol2() 
```

You can access button states directly in `draw()` with `getValue()` or `isPressed()`:

```js
nano.getValue(SLIDER_1) // <-- returns a value between 0 and 1
```

```js
nano.isPressed(REC_2) // <-- returns true or false
```

Use the callback functions `buttonPressed` and `buttonReleased` to capture button events. These work similarly to p5.js's `mousePressed()` or `keyPressed()` functions. 

For example:

```js
function buttonPressed(btn) {
  if (btn === PLAY) {
    console.log("Playing");
  }
}
```

For sliders and knobs, use `controlChanged`:

```js
function controlChanged(ctrl) {
  if (ctrl === KNOB_1) {
    background(nano.getValue(KNOB_1) * 255);
  }
}
```

### Minimal example

```js
let nano;

function setup() {
  createCanvas(600, 600);
  nano = new NanoKontrol2();
  background(176);
}

function buttonPressed(btn) {
  if (btn === PLAY) {
    background("lime");
  }
  if (btn === STOP) {
    background("red");
  }
}
```

More examples are available in the `examples` folder.

## Configuring the nanoKONTROL2

For the library to work, the nanoKONTROL2 needs to be in **CC mode** with **External LED control**, and using its **default MIDI configuration**. To set this up:

1. **Restore factory settings** (only needed if you've previously changed settings with the KORG KONTROL Editor). Hold down the PREV TRACK, NEXT TRACK, and CYCLE buttons while connecting the USB cable. The transport buttons, except CYCLE, will blink.

2. **Enable CC mode.** Hold down the SET MARKER and CYCLE buttons while connecting the USB cable.

3. **Set LED Mode to "External".** Open the [KORG KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/), go to the Control tab, select "Common", and set LED Mode to "External". This is required for external LED control to work.

For more details, see the Korg nanoKONTROL2 [Owner's Manual](https://www.korg.com/us/support/download/manual/0/159/1912/) and [Parameter Guide](https://cdn.korg.com/us/support/download/files/c8d0cd6808e12d3672845cadcdbbfe9b.pdf).

## Building from source

```bash
npm install
npm run build       # production + development bundles + type declarations
npm run build:dev   # unminified bundle only
npm run watch       # rebuild on change
```

## Frequently asked questions

### Is this for making music?

No (unless you want it to be).

Although MIDI controllers are often used for music production, this library is not audio-specific. It lets you use the controller's sliders, knobs, buttons, and LEDs as input and output devices for any p5.js sketch.

For example, you could use a slider to control the speed of an animation or the size of an object, or use toggle buttons to switch different effects on and off. It's all up to you.

If you want to use p5.js for audio, check out [p5.sound](https://p5js.org/reference/p5.sound/) or [tone.js](https://tonejs.github.io/).

### Is this library compatible with other MIDI controllers?

No.

The [Korg nanoKONTROL2](https://www.korg.com/us/products/computergear/nanokontrol2/) is the only MIDI controller I own, and I wanted to use it in my p5.js sketches :)

This is also a choice to keep the project scope small.

If you want to use a different MIDI controller with p5.js, you can use [WebMidi.js v3](https://webmidijs.org/) directly.

## AI Disclosure

Though large parts of this project's code and documentation were written or edited with the help of LLM-based tools including Claude Code and GitHub Copilot, a real human (me, [@SableRaf](https://github.com/SableRaf)) made all the design decisions, tested the code, and verified that everything works as described. If you ask me a question about the library, I will use my human brain to think about the answer, and type it out with my human fingers. If you find a bug, please report it on [GitHub](https://github.com/SableRaf/p5js_nanoKontrol2/issues).

## Acknowledgements

- [WebMidi.js](https://webmidijs.org/) is the underlying library that handles MIDI input/output
- [p5.js](https://p5js.org/)
- [OpenProcessing](https://openprocessing.org/)

## Official Korg nanoKONTROL2 resources

- [Korg KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/)
- [Korg nanoKONTROL2 Parameter Guide](https://cdn.korg.com/us/support/download/files/c8d0cd6808e12d3672845cadcdbbfe9b.pdf)
- [Korg nanoKONTROL2 Owner's Manual](https://www.korg.com/us/support/download/manual/0/159/1912/)
- [Korg nanoKONTROL2 MIDI Implementation Chart](https://cdn.korg.com/us/support/download/files/aeb2862daf0cb7db826d8c62f51ec28d.txt)
- [Korg nanoKONTROL2 product page](https://www.korg.com/us/products/computergear/nanokontrol2/)

## License

This project uses the GPL-2.0-or-later License. See the [LICENSE](LICENSE) file for details.