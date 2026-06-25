// KORG nanoKONTROL2 layout

let referenceImage;

async function setup() {
  createCanvas(1000, 234);
  referenceImage = await loadImage("reference.png")
  noLoop();
}

function draw() {
  background(255);
  stroke("black");
  strokeWeight(1);
  noFill();

  image(referenceImage,0,0,width, height);

  body();
  powerLED();
  parameters();
  navigation();
  transport();
}

function body() {
  rect(1, 1, 998, 232, 15);
}

function powerLED() {
  pill(15, 15, 20, 6);
}

function parameters() {
  push();
  translate(205,0);
  for (let i = 0; i < 8; i++) {
    translate(87, 0);
    rect(0, 183, 29, 29, 5); // rec
    rect(0, 136, 29, 29, 5); // mute
    rect(0, 88, 29, 29, 5);  // solo
    circle(54, 35, 31);      // knob
    pill(49, 89, 9, 123);    // fader
  }
  pop();
}

function navigation() {
  pill(27, 101, 38, 19);  // prev_track
  pill(76, 101, 38, 19);  // next_track
  pill(125, 141, 38, 19); // set_marker
  pill(174, 141, 38, 19); // prev_marker
  pill(223, 141, 38, 19); // next_marker
}

function transport() {
  pill(27, 141, 38, 19);     // cycle
  rect(28, 180, 36, 36, 8);  // rewind
  rect(77, 180, 36, 36, 8);  // fastforward
  rect(126, 180, 36, 36, 8); // stop
  rect(175, 180, 36, 36, 8); // play
  rect(224, 180, 36, 36, 8); // rec
}

function pill(x, y, w, h) {
  rect(x, y, w, h, min(w, h) / 2);
}