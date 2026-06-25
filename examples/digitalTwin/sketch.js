// KORG nanoKONTROL2 — interactive digital twin

let midi;

// Per-channel toggle state
const solo = new Array(8).fill(false);
const mute = new Array(8).fill(false);
const rec  = new Array(8).fill(false);

// Momentary held state for transport / navigation
const held = {};

const C = {
  bg:        '#1a1a1a',
  body:      '#222222',
  btnFill:   '#2a2a2a',
  btnStroke: '#ffffff',
  symbol:    '#ffffff',
  active:    '#ff2222',
  activeDim: '#5a0000',
  knobBg:    '#333333',
  faderBg:   '#333333',
  faderThumb:'#cccccc',
};

async function setup() {
  createCanvas(1000, 234);
  midi = new NanoKontrol2({
    debugLogs: false,
    onReady: syncLeds,
  });

  // Re-sync LEDs whenever the device reconnects (onReady only fires once at init).
  WebMidi.addListener('connected', (e) => {
    if (e.port.type === 'output' && e.port.name.includes('nanoKONTROL2')) {
      syncLeds();
    }
  });
}

function draw() {
  background(C.bg);
  body();
  powerLED();
  parameters();
  navigation();
  transport();
}

function body() {
  stroke(80);
  fill(C.body);
  strokeWeight(1);
  rect(1, 1, 998, 232, 15);
}

function powerLED() {
  const connected = midi && midi._output !== null;
  noStroke();
  if (connected) {
    // glow
    for (let r = 18; r > 0; r -= 3) {
      fill(255, 255, 255, map(r, 0, 18, 0, 60));
      rect(15 - r/2, 15 - r/2, 20 + r, 6 + r, (min(20 + r, 6 + r)) / 2);
    }
    fill(255);
  } else {
    fill(60);
  }
  pill(15, 15, 20, 6);
  stroke(C.btnStroke);
  noFill();
  pill(15, 15, 20, 6);
}

function parameters() {
  push();
  translate(205, 0);
  for (let i = 0; i < 8; i++) {
    translate(87, 0);
    const n = i + 1;

    // rec (design: letter R)
    drawSquareBtn(0, 183, 29, 29, 5, rec[i]);
    drawLetter(14, 197, 'R', rec[i]);

    // mute (design: letter M)
    drawSquareBtn(0, 136, 29, 29, 5, mute[i]);
    drawLetter(14, 150, 'M', mute[i]);

    // solo (design: letter S)
    drawSquareBtn(0, 88, 29, 29, 5, solo[i]);
    drawLetter(14, 102, 'S', solo[i]);

    // knob (design: circle with indicator line)
    const knobVal = midi ? midi.getValue(`KNOB_${n}`) : 0;
    noStroke(); fill(C.knobBg);
    circle(54, 35, 31);
    stroke(C.btnStroke); strokeWeight(1); noFill();
    circle(54, 35, 31);
    const kAngle = map(knobVal, 0, 1, HALF_PI + 0.5, TWO_PI + HALF_PI - 0.5);
    stroke(C.symbol); strokeWeight(2);
    line(54, 35, 54 + cos(kAngle) * 12, 35 + sin(kAngle) * 12);
    strokeWeight(1);

    // fader (design: track + thumb)
    const sliderVal = midi ? midi.getValue(`SLIDER_${n}`) : 0;
    noStroke(); fill(C.faderBg);
    rect(49 + 1, 89, 7, 123, 3);
    stroke(C.btnStroke); noFill();
    pill(49, 89, 9, 123);
    const thumbH = 12;
    const ty = 89 + (123 - thumbH) * (1 - sliderVal);
    noStroke(); fill(C.faderThumb);
    rect(49, ty, 9, thumbH, 3);
  }
  pop();
}

function navigation() {
  drawPillBtn(27,  101, 38, 19, held['PREV_TRACK'],  true);
  drawTriLeft(46, 110);

  drawPillBtn(76,  101, 38, 19, held['NEXT_TRACK'],  true);
  drawTriRight(95, 110);

  drawPillBtn(125, 141, 38, 19, held['SET_MARKER'],  true);
  drawLabel(144, 150, 'SET');

  drawPillBtn(174, 141, 38, 19, held['PREV_MARKER'], true);
  drawTriLeft(193, 150);

  drawPillBtn(223, 141, 38, 19, held['NEXT_MARKER'], true);
  drawTriRight(242, 150);
}

function transport() {
  drawPillBtn(27, 141, 38, 19, held['CYCLE']);
  drawLabel(46, 150, 'CYCLE');

  drawSquareBtn(28,  180, 36, 36, 8, held['REW']);
  drawDoubleTriLeft(46, 198);

  drawSquareBtn(77,  180, 36, 36, 8, held['FF']);
  drawDoubleTriRight(95, 198);

  drawSquareBtn(126, 180, 36, 36, 8, held['STOP']);
  noStroke(); fill(C.symbol);
  rect(138, 192, 12, 12, 1);

  drawSquareBtn(175, 180, 36, 36, 8, held['PLAY']);
  drawTriRight(193, 198);

  drawSquareBtn(224, 180, 36, 36, 8, held['REC']);
  noStroke(); fill(C.symbol);
  circle(242, 198, 13);
}

// ── Widget helpers ────────────────────────────────────────────────────────────

function drawSquareBtn(x, y, w, h, r, active) {
  noStroke();
  fill(active ? C.activeDim : C.btnFill);
  rect(x, y, w, h, r);
  if (active) {
    // glow outline
    for (let t = 4; t > 0; t--) {
      stroke(255, 34, 34, t * 30);
      strokeWeight(t * 1.5);
      noFill();
      rect(x, y, w, h, r);
    }
  }
  stroke(active ? C.active : C.btnStroke);
  strokeWeight(1);
  noFill();
  rect(x, y, w, h, r);
}

function drawPillBtn(x, y, w, h, active, noLed = false) {
  noStroke();
  fill(active && !noLed ? C.activeDim : C.btnFill);
  pill(x, y, w, h);
  if (active && !noLed) {
    for (let t = 4; t > 0; t--) {
      stroke(255, 34, 34, t * 30);
      strokeWeight(t * 1.5);
      noFill();
      pill(x, y, w, h);
    }
  }
  stroke(active && !noLed ? C.active : C.btnStroke);
  strokeWeight(active && noLed ? 2 : 1);
  noFill();
  pill(x, y, w, h);
  strokeWeight(1);
}

function pill(x, y, w, h) {
  rect(x, y, w, h, min(w, h) / 2);
}

function drawLetter(cx, cy, letter, active) {
  noStroke();
  fill(active ? C.active : C.symbol);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(13);
  text(letter, cx, cy);
  textStyle(NORMAL);
}

function drawLabel(cx, cy, txt) {
  noStroke();
  fill(C.symbol);
  textAlign(CENTER, CENTER);
  textSize(7);
  text(txt, cx, cy);
}

function drawTriLeft(cx, cy) {
  noStroke(); fill(C.symbol);
  triangle(cx - 6, cy, cx + 4, cy - 6, cx + 4, cy + 6);
}

function drawTriRight(cx, cy) {
  noStroke(); fill(C.symbol);
  triangle(cx + 6, cy, cx - 4, cy - 6, cx - 4, cy + 6);
}

function drawDoubleTriLeft(cx, cy) {
  noStroke(); fill(C.symbol);
  triangle(cx - 8, cy, cx,     cy - 6, cx,     cy + 6);
  triangle(cx,     cy, cx + 8, cy - 6, cx + 8, cy + 6);
}

function drawDoubleTriRight(cx, cy) {
  noStroke(); fill(C.symbol);
  triangle(cx + 8, cy, cx,     cy - 6, cx,     cy + 6);
  triangle(cx,     cy, cx - 8, cy - 6, cx - 8, cy + 6);
}

// ── LED sync ──────────────────────────────────────────────────────────────────

// Navigation buttons have no LEDs — visual-only via held state.
const NAV = ['PREV_TRACK', 'NEXT_TRACK', 'SET_MARKER', 'PREV_MARKER', 'NEXT_MARKER'];
const TRANSPORT = ['PLAY', 'STOP', 'REW', 'FF', 'REC', 'CYCLE'];

// ── LED sync ──────────────────────────────────────────────────────────────────

function syncLeds() {
  for (let i = 1; i <= 8; i++) {
    midi.setLed(window[`SOLO_${i}`], solo[i-1]);
    midi.setLed(window[`MUTE_${i}`], mute[i-1]);
    midi.setLed(window[`REC_${i}`],  rec[i-1]);
  }
  for (const name of TRANSPORT) {
    midi.setLed(window[name], !!held[name]);
  }
}

// ── MIDI callbacks ────────────────────────────────────────────────────────────

function buttonPressed() {
  const inp = midi.input;
  for (let i = 1; i <= 8; i++) {
    if (inp === window[`SOLO_${i}`]) { solo[i-1] = !solo[i-1]; midi.setLed(inp, solo[i-1]); return; }
    if (inp === window[`MUTE_${i}`]) { mute[i-1] = !mute[i-1]; midi.setLed(inp, mute[i-1]); return; }
    if (inp === window[`REC_${i}`])  { rec[i-1]  = !rec[i-1];  midi.setLed(inp, rec[i-1]);  return; }
  }
  for (const name of TRANSPORT) {
    if (inp === window[name]) { held[name] = true; midi.setLed(inp, true); return; }
  }
  for (const name of NAV) {
    if (inp === window[name]) { held[name] = true; return; }
  }
}

function buttonReleased() {
  const inp = midi.input;
  for (const name of TRANSPORT) {
    if (inp === window[name]) { held[name] = false; midi.setLed(inp, false); return; }
  }
  for (const name of NAV) {
    if (inp === window[name]) { held[name] = false; return; }
  }
}

function inputChanged() {
  // sliders and knobs read via getValue() in draw
}
