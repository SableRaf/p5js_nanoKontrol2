// setType() changes how a button behaves.
// Here MUTE_1 becomes a toggle: each press flips it on or off,
// instead of being active only while held.

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
  text('Press MUTE_1 to toggle', width / 2, 40);
  if (nano.isToggled(MUTE_1)) {
    fill(0);
  } else {
    noFill();
  }
  rect(width / 2, height / 2, 300, 300);
}
