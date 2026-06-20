// nanoKONTROL2 → sketch parameters (WebMidi.js v3)
// A minimal starting point: connects to the controller, maps every control
// to a friendly name, and reads them in draw(). No debug log / visualization —
// replace the demo drawing with your own.

let playing = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  if(nano.getButtonPressed('play')) playing = true;
  if(nano.getButtonPressed('stop')) playing = false;

  const h = map(nano.getValue('knob1'), 0, 1, 100, 360);   // 0..360
  const s = map(nano.getValue('knob2'), 0, 1, 30, 100);  // 0..100
  const b = map(nano.getValue('knob3'), 0, 1, 20, 100);  // 0..100
  background(h, s, playing ? b : b * 0.4);

  if(nano.isPressed('solo1')) {
    
  }

  // Eight faders as a simple bar field — purely to confirm input works.
  fill(0, 0, 100);
  const w = width / 8;
  for (let i = 0; i < 8; i++) {
    const v = nano.getValue(`fader${i + 1}`);   // 0..1
    const h = v * height;
    rect(i * w, height - h, w - 4, h);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}