// nanoKONTROL2 → sketch parameters using the p5.nanokontrol2 addon.

let midi;
let hue = 0;
let saturation = 100;
let brightness = 100;
let playing = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  colorMode(HSB, 360, 100, 100);

  midi = new NanoKontrol2({ debugLogs: true });
  midi.setSmooth({ enabled: true, easingType: 'easeOut', duration: 500 });
}

function draw() {
  // No midi.interpolate() needed — handled by the predraw lifecycle hook.
  background(hue, saturation, playing ? brightness : brightness * 0.4);

  // Eight sliders as a simple bar field — purely to confirm input works.
  fill(0, 0, 100);
  const w = width / 8;
  for (let i = 0; i < 8; i++) {
    const v = midi.getValue(`SLIDER_${i + 1}`);
    const h = v * height;
    rect(i * w, height - h, w - 4, h);
  }
}

function inputChanged() {
  const inputName = midi.input.name;
  if (inputName === KNOB_1) hue = midi.value * 360;
  if (inputName === KNOB_2) saturation = 30 + midi.value * 70;
  if (inputName === KNOB_3) brightness = 20 + midi.value * 80;
}

function buttonPressed() {
  const inputName = midi.input.name;
  if (inputName === PLAY) {
    playing = true;
    midi.setLed(PLAY, true);
    midi.setLed(STOP, false);
  }
  if (inputName === STOP) {
    playing = false;
    midi.setLed(PLAY, false);
    midi.setLed(STOP, true);
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
