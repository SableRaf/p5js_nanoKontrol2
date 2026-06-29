// setToggled() sets a button's latched state from code,
// as if it had been pressed. Here MUTE_1 starts already toggled on,
// so the square is filled before you touch anything.

let nano;

function setup() {
  createCanvas(600, 600);
  nano = new NanoKontrol2();
  nano.setType(MUTE_1, 'toggle');
  nano.setToggled(MUTE_1, true);
  rectMode(CENTER);
}

function draw() {
  background(175);
  textAlign(CENTER);
  text('MUTE_1 starts on. Press it to toggle off', width / 2, 40);
  if (nano.isToggled(MUTE_1)) {
    fill(0);
  } else {
    noFill();
  }
  rect(width / 2, height / 2, 300, 300);
}
