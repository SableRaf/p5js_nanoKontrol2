// MUTE_1 is set up as a toggle, so each press flips its latched state.
// isToggled() reads that latched state, which stays on between presses.

let nano;

function setup() {
  createCanvas(600, 600);
  nano = new NanoKontrol2();
  nano.setType(MUTE_1, 'toggle');
  rectMode(CENTER);
}

function draw() {
  background(175);
  fill(0);
  textAlign(CENTER);
  text('Press MUTE_1 to toggle the fill', width / 2, 40);
  if (nano.isToggled(MUTE_1)) {
    fill(0);
  } else {
    noFill();
  }
  rect(width / 2, height / 2, 300, 300);
}
