// A single bouncing creature tied to one nanoKONTROL2 channel.
// Owns its eased motion/energy state and knows how to draw itself.
class Character {
  constructor(index) {
    this.index = index;       // 0-based channel index

    // Input state, set by the sketch from nanoKONTROL2 controls.
    this.solo = false;     // SOLO held
    this.mute = false;     // MUTE held
    this.sleeping = false; // asleep (STOP/REC) vs awake (PLAY)
    this.slider = 0.5;     // resting height, 0..1
    this.hueShift = 0;     // degrees, from the knob

    // Eased state so transitions are smooth.
    this.energy = 1;   // 1 awake & bouncing, 0 asleep
    this.charY = null; // current eased vertical position
  }

  draw(slotWidth) {
    const i = this.index;
    const cx = slotWidth * (i + 0.5);

    // Slider sets the resting height: 1 -> high, 0 -> low.
    const slider = this.slider;

    const sleeping = this.sleeping;

    // Target position: follow the slider while awake, sink low when asleep.
    const targetY = sleeping
      ? height * 0.92
      : map(slider, 0, 1, height * 0.8, height * 0.15);

    // Ease toward the target (this is the "ease to the rest position").
    if (this.charY === null) this.charY = targetY;
    this.charY = lerp(this.charY, targetY, 0.08);

    // Ease energy toward awake/asleep so motion calms down smoothly.
    this.energy = lerp(this.energy, sleeping ? 0 : 1, 0.06);
    const e = this.energy;

    // Scale the original ~430px-wide character to fit the channel slot.
    const s = (slotWidth * 0.95) / 430;

    // Eyes shut when soloing or while falling asleep.
    const eyesShut = this.solo || e < 0.5;
    const mouthExtra = this.mute ? 100 : 0;

    push();
    translate(cx, this.charY);
    scale(s);
    strokeWeight(16);

    const t = frameCount * 0.1 + i; // per-channel phase so they don't sync up

    const bodyVerticalOffset = -200 + sin(t) * 50 * e;
    const bodyWidth = 300;

    // Pin the body's bottom edge off-screen for any aspect ratio: convert the
    // screen-space bottom (height + margin) into this creature's local space,
    // then size the body so only the top corners move (via bodyVerticalOffset).
    const bodyBottomLocal = (height + 100 - this.charY) / s;
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
    this.fillFromPalette();
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
      arc(mouthCenterX, mouthVerticalOffset, mouthWidth * 0.5, mouthWidth * 0.5, 0, PI);
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
  fillFromPalette() {
    const palette = palettes[paletteIndex];
    const hex = palette[(this.index + paletteOffset) % palette.length];
    const c = color(hex);
    push();
    colorMode(HSB, 360, 100, 100);
    const shifted = color((hue(c) + this.hueShift) % 360, saturation(c), brightness(c));
    pop();
    fill(shifted);
  }
}
