// A row of eight characters, one per nanoKONTROL2 channel.
// Each character is the exact character from the original sketch — only its
// hue changes per channel.
//
//   SLIDER_n    -> how high the character floats (0 = low, 1 = high)
//   KNOB_n      -> the character's hue shift (on top of palette color)
//   SOLO_n      -> blink (eyes shut while held)
//   MUTE_n      -> open mouth (while held)
//   REC_n       -> toggle this character's sleep state (press to flip)
//   PLAY        -> everyone wakes up and bounces (default)
//   STOP        -> everyone eases down to a low rest position and falls asleep
//   PREV/NEXT_MARKER -> cycle palette color offset (shift which color each character gets)
//   PREV/NEXT_TRACK  -> cycle which palette is active

const CHANNELS = 8;

let midi;
let playing = true;

// Adapted from https://ronikaufman.github.io/color_pals/
const palettes = [
  ["#f398c3", "#f44e24", "#f4d730", "#23b247", "#2a76d3"],
  ["#fef9c6", "#ffcc4d", "#f5b800", "#56a1c4", "#4464a1", "#ee726b", "#df5f50", "#5a3034"],
  ["#4464a1", "#62b6de", "#b3dce0", "#ffc5c7", "#ee726b", "#cd1440"],
  ["#f2eb8a", "#fed000", "#fc8405", "#ed361a", "#4464a1", "#f398c3", "#cf3895", "#6d358a", "#06b4b0", "#4b8a5f"],
  ["#abcd5e", "#29ac9f", "#14976b", "#b3dce0", "#62b6de", "#2b67af", "#f589a3", "#ef562f", "#fc8405", "#f9d531"],
  ["#584594", "#e488b7", "#d74c41", "#f0d235", "#36ad63", "#69bcea"]
]

let paletteIndex = 0;  // which palette is active
let paletteOffset = 0; // shifts which color each character gets

// Per-channel held-button state, tracked from buttonPressed/buttonReleased.
const solo = new Array(CHANNELS).fill(false);
const mute = new Array(CHANNELS).fill(false);
const awake = new Array(CHANNELS).fill(true); // toggled by REC_n
const hueShift = new Array(CHANNELS).fill(0); // degrees, from the knob

// Eased per-channel state so transitions are smooth.
const energy = new Array(CHANNELS).fill(1); // 1 awake & bouncing, 0 asleep
const charY = new Array(CHANNELS).fill(null); // current eased vertical position

function setup() {
  createCanvas(windowWidth, windowHeight);

  midi = new NanoKontrol2({ onReady() { midi.setLed(PLAY, true); }});

  // midi.setSmooth({ enabled: true, easingType: 'easeOut', duration: 400 });
}

function draw() {
  background(200, 65, 0);

  const slotWidth = width / CHANNELS;
  for (let i = 0; i < CHANNELS; i++) {
    drawCharacter(i, slotWidth);
  }
}

function drawCharacter(i, slotWidth) {
  const cx = slotWidth * (i + 0.5);

  // Slider sets the resting height: 1 -> high, 0 -> low.
  const slider = midi.getValue(`SLIDER_${i + 1}`, { defaultValue: 0.5 });

  // Asleep when globally stopped or this creature was toggled asleep via REC.
  const sleeping = !playing || !awake[i];

  // Target position: follow the slider while awake, sink low when asleep.
  const targetY = sleeping
    ? height * 0.92
    : map(slider, 0, 1, height * 0.8, height * 0.15);

  // Ease toward the target (this is the "ease to the rest position").
  if (charY[i] === null) charY[i] = targetY;
  charY[i] = lerp(charY[i], targetY, 0.08);

  // Ease energy toward awake/asleep so motion calms down smoothly.
  energy[i] = lerp(energy[i], sleeping ? 0 : 1, 0.06);
  const e = energy[i];

  // Scale the original ~430px-wide character to fit the channel slot.
  const s = (slotWidth * 0.95) / 430;

  // Eyes shut when soloing or while falling asleep.
  const eyesShut = solo[i] || e < 0.5;
  const mouthExtra = mute[i] ? 100 : 0;

  push();
  translate(cx, charY[i]);
  scale(s);
  strokeWeight(16);

  const t = frameCount * 0.1 + i; // per-channel phase so they don't sync up

  const bodyVerticalOffset = -200 + sin(t) * 50 * e;
  const bodyWidth = 300;

  // Pin the body's bottom edge off-screen for any aspect ratio: convert the
  // screen-space bottom (height + margin) into this creature's local space,
  // then size the body so only the top corners move (via bodyVerticalOffset).
  const bodyBottomLocal = (height + 100 - charY[i]) / s;
  const bodyHeight = bodyBottomLocal - bodyVerticalOffset;

  const mouthWidth = 100;
  const mouthVerticalOffset = 100 + sin(t) * 40 * e;
  const mouthHorizontalOffset = -mouthWidth / 2 + 20;

  const eyesVerticalOffset = 30 + sin(t) * 30 * e;
  const leftEyeSize = 130;

  const toothWidth = 16;
  const toothHeight = 18;
  const toothRounding = 50;

  // body
  fillFromPalette(i);
  rect(-bodyWidth / 2, bodyVerticalOffset, bodyWidth, bodyHeight, bodyWidth / 2, bodyWidth / 2);

  // eyes
  fill(255);
  ellipse(-150, eyesVerticalOffset, leftEyeSize);
  ellipse(+150, eyesVerticalOffset, 100);

  // pupils
  noStroke();
  fill(0);
  ellipse(-150, eyesVerticalOffset, 50);
  ellipse(+150, eyesVerticalOffset, 40);

  // eyelids
  stroke(0);
  fill(255, 213, 0);
  if (eyesShut) {
    ellipse(-150, eyesVerticalOffset, leftEyeSize);
    ellipse(+150, eyesVerticalOffset, 100);
  }

  // mouth
  if (sleeping) {
    // asleep: a single smiley line instead of the toothy mouth
    noFill();
    stroke(0);
    const mouthCenterX = mouthHorizontalOffset + mouthWidth / 2;
    arc(mouthCenterX, mouthVerticalOffset, mouthWidth*0.5, mouthWidth*0.5, 0, PI);
  } else {
    // mouth (opens on MUTE button pressed)
    fill(240, 150, 150);
    rect(mouthHorizontalOffset, mouthVerticalOffset, mouthWidth, 80 + mouthExtra, 5, 5, 100, 100);

    // teeth
    noStroke();
    fill(255);
    rect(mouthHorizontalOffset + 12, mouthVerticalOffset + 8, toothWidth, toothHeight, 0, 0, toothRounding, toothRounding);
    rect(mouthHorizontalOffset + 32, mouthVerticalOffset + 8, toothWidth, toothHeight, 0, 0, toothRounding, toothRounding);
    rect(mouthHorizontalOffset + 52, mouthVerticalOffset + 8, toothWidth, toothHeight, 0, 0, toothRounding, toothRounding);
    rect(mouthHorizontalOffset + 72, mouthVerticalOffset + 8, toothWidth, toothHeight, 0, 0, toothRounding, toothRounding);
  }

  pop();
}

// Set the fill to the character's palette color, shifted by its knob hue.
function fillFromPalette(i) {
  const palette = palettes[paletteIndex];
  const hex = palette[(i + paletteOffset) % palette.length];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const [rr, gg, bb] = rotateHue(r, g, b, hueShift[i]);
  fill(rr, gg, bb);
}

// Rotate an RGB color's hue by `deg` degrees (via HSV), returns [r,g,b] 0..255.
function rotateHue(r, g, b, deg) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = mx === 0 ? 0 : d / mx;
  const v = mx;

  h = (((h + deg) % 360) + 360) % 360;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0, gp = 0, bp = 0;
  if (h < 60) { rp = c; gp = x; }
  else if (h < 120) { rp = x; gp = c; }
  else if (h < 180) { gp = c; bp = x; }
  else if (h < 240) { gp = x; bp = c; }
  else if (h < 300) { rp = x; bp = c; }
  else { rp = c; bp = x; }
  return [(rp + m) * 255, (gp + m) * 255, (bp + m) * 255];
}

function inputChanged() {
  for (let i = 0; i < CHANNELS; i++) {
    if (midi.input === window[`KNOB_${i + 1}`]) {
      hueShift[i] = midi.value * 360;
    }
  }
}

function buttonPressed() {
  setHeld(true);

  // REC_n toggles a single creature's sleep state.
  for (let i = 0; i < CHANNELS; i++) {
    if (midi.input === window[`REC_${i + 1}`]) {
      awake[i] = !awake[i];
      midi.setLed(`REC_${i + 1}`, !awake[i]); // lit while asleep
    }
  }

  if (midi.input === PLAY) {
    playing = true;
    midi.setLed(PLAY, true);
    midi.setLed(STOP, false);
  }
  if (midi.input === STOP) {
    playing = false;
    midi.setLed(PLAY, false);
    midi.setLed(STOP, true);
  }

  if (midi.input === PREV_MARKER) paletteOffset = ((paletteOffset - 1) % palettes[paletteIndex].length + palettes[paletteIndex].length) % palettes[paletteIndex].length;
  if (midi.input === NEXT_MARKER) paletteOffset = (paletteOffset + 1) % palettes[paletteIndex].length;
  if (midi.input === PREV_TRACK) {
    paletteIndex = ((paletteIndex - 1) % palettes.length + palettes.length) % palettes.length;
    paletteOffset = 0;
  }
  if (midi.input === NEXT_TRACK) {
    paletteIndex = (paletteIndex + 1) % palettes.length;
    paletteOffset = 0;
  }
}

function buttonReleased() {
  setHeld(false);
}

// Update the per-channel held state for SOLO/MUTE (hold-only) and mirror on LEDs.
function setHeld(on) {
  for (let i = 0; i < CHANNELS; i++) {
    if (midi.input === window[`SOLO_${i + 1}`]) { solo[i] = on; midi.setLed(`SOLO_${i + 1}`, on); }
    if (midi.input === window[`MUTE_${i + 1}`]) { mute[i] = on; midi.setLed(`MUTE_${i + 1}`, on); }
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
