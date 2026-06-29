// Demo sketch for the p5.nanokontrol2 addon library
// See: https://github.com/SableRaf/p5js_nanoKontrol2

// Each of the 8 channels has a character that bounces up and down,
// and respond to the controls on the nanoKONTROL2.
//
// Try these:
//
//   SLIDER_n    -> slide to change the height of the character
//   KNOB_n      -> turn to shift the character's color hue
//   SOLO_n      -> hold to close the character's eyes
//   MUTE_n      -> hold to open mouth extra wide
//   REC_n       -> put the character to sleep
//   PLAY        -> everyone wakes up
//   STOP        -> everyone falls asleep
//   PREV/NEXT_MARKER -> shift character colors left/right
//   PREV/NEXT_TRACK  -> pick previous/next palette

const CHANNELS = 8;

let nano;
let characters = [];

// Adapted from https://ronikaufman.github.io/color_pals/
const palettes = [
  ["#f398c3", "#f44e24", "#f4d730", "#23b247", "#2a76d3"],
  ["#fef9c6", "#ffcc4d", "#f5b800", "#56a1c4", "#4464a1", "#ee726b", "#df5f50", "#5a3034"],
  ["#4464a1", "#62b6de", "#b3dce0", "#ffc5c7", "#ee726b", "#cd1440"],
  ["#f2eb8a", "#fed000", "#fc8405", "#ed361a", "#4464a1", "#f398c3", "#cf3895", "#6d358a", "#06b4b0", "#4b8a5f"],
  ["#abcd5e", "#29ac9f", "#14976b", "#b3dce0", "#62b6de", "#2b67af", "#f589a3", "#ef562f", "#fc8405", "#f9d531"],
  ["#584594", "#e488b7", "#d74c41", "#f0d235", "#36ad63", "#69bcea"],
  ["#F59FAC", "#F2C800", "#72ADDC", "#BC71BA", "#62B100", "#F5B200", "#CC530A"] // Waxy Corn, Dark Orange
]

let paletteIndex = 0;  // which palette is active
let paletteOffset = 0; // shifts which color each character gets

function setup() {
  createCanvas(windowWidth, windowHeight);

  nano = new NanoKontrol2({
    statusLabel: true,
  });

  // PLAY/STOP are a radio group: exactly one is active, and its LED lights
  // automatically. Seed PLAY as the active member so it lights at startup.
  nano.setType([PLAY, STOP], 'radio');
  nano.setToggled(PLAY, true);

  // REC_n latches a creature asleep; the LED lights to match its toggled state.
  for (let i = 0; i < CHANNELS; i++) nano.setType(`REC_${i + 1}`, 'toggle');

  for (let i = 0; i < CHANNELS; i++) characters.push(new Character(i, nano));

  // nano.smoothMode('easeOut', 400);
}

function draw() {
  background("#7dde65");

  const slotWidth = width / CHANNELS;
  for (const character of characters) {
    character.draw(slotWidth);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'f' || key === 'F') {
    fullscreen(!fullscreen());
  }
}

function controlChanged(control) {
  for (const character of characters) {
    if (control === `KNOB_${character.ch}`) {
      character.setKnob(nano.value);
    }
  }
}

function buttonPressed(btn) {
  for (const character of characters) character.setHeld(btn, true);

  if (btn === NEXT_MARKER) paletteOffset = ((paletteOffset - 1) % palettes[paletteIndex].length + palettes[paletteIndex].length) % palettes[paletteIndex].length;
  if (btn === PREV_MARKER) paletteOffset = (paletteOffset + 1) % palettes[paletteIndex].length;
  if (btn === PREV_TRACK) {
    paletteIndex = ((paletteIndex - 1) % palettes.length + palettes.length) % palettes.length;
    paletteOffset = 0;
  }
  if (btn === NEXT_TRACK) {
    paletteIndex = (paletteIndex + 1) % palettes.length;
    paletteOffset = 0;
  }
}

function buttonReleased(btn) {
  for (const character of characters) character.setHeld(btn, false);
}
