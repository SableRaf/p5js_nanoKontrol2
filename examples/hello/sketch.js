// Move the first linear fader up and down to change the size of the square

let midi;

let size = 300;

function setup() {
  createCanvas(600, 600);
  midi = new NanoKontrol2();
  rectMode(CENTER);
  background(175);
}

function draw() {
  push();
  translate(width / 2, height / 2);
  rotate(map(frameCount, 0, 360, 0, TWO_PI));
  rect(0, 0, size, size);
  pop();
}

function inputChanged() {
  if (midi.input.name === 'SLIDER_1') {
    size = map(midi.getValue('SLIDER_1'), 0, 1, 50, min(width, height) * 0.6);
    console.log('Slider 1 value:', midi.getValue('SLIDER_1'));
  }
}