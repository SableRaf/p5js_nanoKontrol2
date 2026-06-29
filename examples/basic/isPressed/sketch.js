// The square is filled only while you hold down REC_1.
// isPressed() reports whether a button is physically held right now.

let nano;

function setup() {
  createCanvas(600, 600);
  nano = new NanoKontrol2();
  rectMode(CENTER);
}

function draw() {
  background(175);
  fill(0);
  textAlign(CENTER);
  text('Hold REC_1', width / 2, 40);
  if (nano.isPressed(REC_1)) {
    fill(0);
  } else {
    noFill();
  }
  rect(width / 2, height / 2, 300, 300);
}
