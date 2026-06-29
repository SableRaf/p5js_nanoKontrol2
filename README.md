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
  if (midi.input.name === PLAY) {
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
  if (midi.input.name === PLAY) {
    background("lime");
  }
  if (midi.input.name === STOP) {
    background("red");
  }
}
```

More examples are available in the `examples` folder.

## Configuring the nanoKONTROL2

For the library to work, the nanoKONTROL2 needs to be in **CC mode** with **External LED control**, and using its **default MIDI configuration**. To set this up:

1. **Restore factory settings** (only needed if you've previously changed settings with the KORG KONTROL Editor). Hold down the PREV TRACK, NEXT TRACK, and CYCLE buttons while connecting the USB cable. The transport buttons, except CYCLE, will blink.

2. **Enable CC mode.** Hold down the SET MARKER and CYCLE buttons while connecting the USB cable. (The library does not work in the default "DAW mode".)

3. **Set LED Mode to "External".** Open the [KORG KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/), go to the Control tab, select "Common", and set LED Mode to "External". This is required for external LED control to work.

For more details, see the Korg nanoKONTROL2 [Owner's Manual](https://www.korg.com/us/support/download/manual/0/159/1912/) and [Parameter Guide](https://cdn.korg.com/us/support/download/files/c8d0cd6808e12d3672845cadcdbbfe9b.pdf).

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

## Official Korg nanoKONTROL2 resources

- [Korg KONTROL Editor](https://www.korg.com/us/support/download/software/1/133/1355/)
- [Korg nanoKONTROL2 Parameter Guide](https://cdn.korg.com/us/support/download/files/c8d0cd6808e12d3672845cadcdbbfe9b.pdf)
- [Korg nanoKONTROL2 Owner's Manual](https://www.korg.com/us/support/download/manual/0/159/1912/)
- [Korg nanoKONTROL2 MIDI Implementation Chart](https://cdn.korg.com/us/support/download/files/aeb2862daf0cb7db826d8c62f51ec28d.txt)
- [Korg nanoKONTROL2 product page](https://www.korg.com/us/products/computergear/nanokontrol2/)

## License

This project uses the GPL-2.0-or-later License. See the [LICENSE](LICENSE) file for details.