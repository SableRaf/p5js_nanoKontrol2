// setRange() maps a control's full travel to a custom range.
// SLIDER_1 now reports 50..550 directly, so getValue() can be
// used as the square's size without any extra map().

let nano;

function setup() {
  createCanvas(600, 600);
  nano = new NanoKontrol2();
  nano.setRange(SLIDER_1, 50, 550);
  rectMode(CENTER);
}

function draw() {
  background(175);
  textAlign(CENTER);
  text('Move SLIDER_1', width / 2, 40);
  let size = nano.getValue(SLIDER_1);
  rect(width / 2, height / 2, size, size);
}
