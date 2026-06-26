# p5.nanokontrol2

A [p5.js](https://p5js.org/) addon library for the [Korg nanoKONTROL2](https://www.korg.com/us/products/computergear/nanokontrol2/) MIDI controller, built on [WebMidi.js v3](https://webmidijs.org/).

## Quick start

Add the scripts to your HTML after p5.js and WebMidi.js:

```html
<script src="https://cdn.jsdelivr.net/npm/webmidi@3/dist/iife/webmidi.iife.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5@2.3.0/lib/p5.min.js"></script>
<script src="dist/p5.nanokontrol2.js"></script>
<script src="sketch.js"></script>
```

Create a `NanoKontrol2` instance in `setup()`, then define callback functions to respond to controls.

Here is a minimal code example:

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

I have a nanoKONTROL2 and I wanted to use it in my p5.js sketches :)

This is also a choice to keep the project scope small.

If you want to use a different MIDI controller with p5.js, you can use [WebMidi.js v3](https://webmidijs.org/) directly.


## AI Disclosure

Large parts of this project's code and documentation were written or edited with the help of LLM-based tools including Claude Code and GitHub Copilot. A real human (me, [@SableRaf](https://github.com/SableRaf)) has tested the code and verified that everything works as described.


## License

This project uses the GPL-2.0-or-later License. See the [LICENSE](LICENSE) file for details.