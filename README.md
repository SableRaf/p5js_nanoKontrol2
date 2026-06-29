# p5.nanokontrol2

A p5.js addon library for the Korg nanoKONTROL2 MIDI controller.

![Layout of the nanoKONTROL2](https://raw.githubusercontent.com/SableRaf/p5js_nanoKontrol2/main/examples/demos/digitalTwin/layout.svg)

More about the nanoKONTROL2 on the [Korg website](https://www.korg.com/us/products/computergear/nanokontrol2/).

## Try it

Demo: https://openprocessing.org/@SableRaph/2973319

![Demo screenshot](https://raw.githubusercontent.com/SableRaf/p5js_nanoKontrol2/main/demo.png)

## Quick start

Import webMidi.js and p5.nanokontrol2 in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/webmidi@3/dist/iife/webmidi.iife.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5.nanokontrol2@0.1.1/dist/p5.nanokontrol2.js"></script>
```

Then, in `setup()`, create a `NanoKontrol2` instance:

```js
midi = new NanoKontrol2() 
```

Use the callback functions to respond to inputs:

```js
function buttonPressed() {
  if (midi.input === PLAY) {
    console.log("Playing");
  }
}
```

Or access input value directly with `getValue()`:

```js
midi.getValue(SLIDER_1)
```

### Minimal example

```js
let midi;

function setup() {
  createCanvas(600, 600);
  midi = new NanoKontrol2();
  background(176);
}

function buttonPressed() {
  if (midi.input === PLAY) {
    background("lime");
  }
  if (midi.input === STOP) {
    background("red");
  }
}
```

More examples are available in the `examples` folder.

## Configuring the nanoKONTROL2

### Operation mode

The nanoKONTROL2 has two different operation modes. A "DAW mode" and a "CC mode". **This library is designed to work exclusively with the nanoKONTROL2 in CC Mode.**

Here is how to switch the nanoKONTROL2 to CC mode as described in the [Owner's Manual](https://www.korg.com/us/support/download/manual/0/159/1912/):

> While pressing and holding down the SET MARKER and CYCLE buttons, connect the USB cable from your computer to the nanoKONTROL2 and engage CC mode.

### LED control mode

External LED control only works when the nanoKONTROL2's **LED Mode is set to "External"**: download and open the [KORG KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/), go to the Control tab, select "Common", and set LED Mode to "External".

### MIDI configuration

The library also assumes that the nanoKONTROL2 is set to its default MIDI configuration.

If you have changed the cc numbers, channels, range, or any other settings, the library may not work as expected.

To restore the factory settings, press and hold the PREV TRACK button, NEXT TRACK button, and CYCLE button simultaneously while connecting the USB cable to the nanoKONTROL2. The transport buttons except the CYCLE button will then blink.

For more information, see the Korg nanoKONTROL2 [Parameter Guide](https://cdn.korg.com/us/support/download/files/c8d0cd6808e12d3672845cadcdbbfe9b.pdf).

## Documentation

For the full API docs, see [API.md](API.md).

## Building from source

```bash
npm install
npm run build       # production + development bundles + type declarations
npm run build:dev   # unminified bundle only
npm run watch       # rebuild on change
```

## Frequently asked questions

### Why does it only work with the nanoKONTROL2?

I have a [Korg nanoKONTROL2](https://www.korg.com/us/products/computergear/nanokontrol2/) and I wanted to use it in my p5.js sketches :)

This is also a choice to keep the project scope small.

If you want to use a different MIDI controller with p5.js, you can use [WebMidi.js v3](https://webmidijs.org/) directly.


## AI Disclosure

Large parts of this project's code and documentation were written or edited with the help of LLM-based tools including Claude Code and GitHub Copilot. A real human (me, [@SableRaf](https://github.com/SableRaf)) has tested the code and verified that everything works as described.

## Acknowledgements

- [WebMidi.js](https://webmidijs.org/) is the underlying library that handles MIDI input/output
- [p5.js](https://p5js.org/)
- [OpenProcessing](https://openprocessing.org/)

## License

This project uses the GPL-2.0-or-later License. See the [LICENSE](LICENSE) file for details.