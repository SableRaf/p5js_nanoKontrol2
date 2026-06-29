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

function setup() {
  createCanvas(windowWidth, windowHeight);

  nano = new NanoKontrol2({
    statusLabel: true, // show the device connection status in the top-left corner of the page
  });

  // PLAY/STOP are a radio group: exactly one is active, and its LED lights
  // automatically. Seed PLAY as the active member so it lights at startup.
  nano.setType([PLAY, STOP], 'radio');
  nano.setToggled(PLAY, true);

  // REC_n latches a creature asleep; the LED lights to match its toggled state.
  for (let i = 0; i < CHANNELS; i++) nano.setType(`REC_${i + 1}`, 'toggle');

  for (let i = 0; i < CHANNELS; i++) characters.push(new Character(i));

  // nano.smoothMode('easeOut', 400);
}

function draw() {
  background("#7dde65");

  // Feed each character its current control state, then draw it.
  const slotWidth = width / CHANNELS;
  for (const character of characters) {
    const i = character.index + 1; // 1-based channel for control names

    character.solo = nano.isPressed(`SOLO_${i}`);
    character.mute = nano.isPressed(`MUTE_${i}`);
    character.sleeping = !nano.isToggled(PLAY) || nano.isToggled(`REC_${i}`);
    
    character.draw(slotWidth);
  }
}

function controlChanged(control) {
  for (const character of characters) {
    const i = character.index + 1; // 1-based channel for control names
    if (control === `KNOB_${i}`) {
      character.hueShift = nano.value * 360;
    }
    if (control === `SLIDER_${i}`) {
      character.slider = nano.value;
    }
  }
}

function buttonPressed(btn) {
  if (btn === NEXT_MARKER) offsetColor(-1);
  if (btn === PREV_MARKER) offsetColor(1);
  if (btn === PREV_TRACK) offsetPalette(-1);
  if (btn === NEXT_TRACK) offsetPalette(1);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'f' || key === 'F') {
    fullscreen(!fullscreen());
  }
}