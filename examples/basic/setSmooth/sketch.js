// setSmooth() makes a control ease toward its target instead of
// jumping. Move SLIDER_1 quickly and the square's size glides
// to follow, smoothing out the motion.

let nano;

function setup() {
  createCanvas(600, 600);
  nano = new NanoKontrol2();
  nano.setSmooth(SLIDER_1, 'easeOut', 500);
  rectMode(CENTER);
}

function draw() {
  background(175);
  textAlign(CENTER);
  text('Move SLIDER_1 quickly', width / 2, 40);
  let size = map(nano.getValue(SLIDER_1), 0, 1, 50, 550);
  rect(width / 2, height / 2, size, size);
}
