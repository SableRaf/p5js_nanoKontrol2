// KORG nanoKONTROL2 — interactive digital twin

let midi;
let ui;

const held = {};

// Per-channel toggle state.
const CH = {
  SOLO: new Array(8).fill(false),
  MUTE: new Array(8).fill(false),
  REC:  new Array(8).fill(false),
};

const NAV       = ['PREV_TRACK', 'NEXT_TRACK', 'SET_MARKER', 'PREV_MARKER', 'NEXT_MARKER'];
const TRANSPORT = ['PLAY', 'STOP', 'REW', 'FF', 'REC', 'CYCLE'];

async function setup() {
  noCanvas();

  ui = new NanoKontrolUI('main', 'layout.svg');
  await ui.load();
  ui.resetKnobs();

  midi = new NanoKontrol2({
    debugLogs: true,
    onReady:        () => { syncLeds(); deviceConnected(); },
    onConnected:    deviceConnected,
    onDisconnected: deviceDisconnected,
  });
}

// ── LED sync ──────────────────────────────────────────────────────────────────

function syncLeds() {
  for (let i = 1; i <= 8; i++) {
    for (const [name, state] of Object.entries(CH)) {
      midi.setLed(window[`${name}_${i}`], state[i-1]);
    }
  }
  for (const name of TRANSPORT) midi.setLed(window[name], !!held[name]);
}

// ── MIDI callbacks ────────────────────────────────────────────────────────────

function deviceConnected() {
  ui.setPowerLed(true);
}

function deviceDisconnected() {
  ui.setPowerLed(false);
}

function buttonPressed() {
  const input = midi.input;

  // Channel strip toggles (SOLO / MUTE / REC)
  for (const [name, state] of Object.entries(CH)) {
    for (let i = 1; i <= 8; i++) {
      if (input !== window[`${name}_${i}`]) continue;
      state[i-1] = !state[i-1];
      midi.setLed(input, state[i-1]);
      ui.setChannelButton(name, i, state[i-1]);
      return;
    }
  }

  // Transport — momentary with LED
  for (const name of TRANSPORT) {
    if (input !== window[name]) continue;
    held[name] = true;
    midi.setLed(input, true);
    ui.pressTransport(name);
    return;
  }

  // Navigation — momentary, no LED
  for (const name of NAV) {
    if (input !== window[name]) continue;
    held[name] = true;
    ui.pressNav(name);
    return;
  }
}

function buttonReleased() {
  const input = midi.input;

  for (const name of TRANSPORT) {
    if (input !== window[name]) continue;
    held[name] = false;
    midi.setLed(input, false);
    ui.releaseTransport(name);
    return;
  }

  for (const name of NAV) {
    if (input !== window[name]) continue;
    held[name] = false;
    ui.releaseNav(name);
    return;
  }
}

function inputChanged() {
  const input = midi.input;
  for (let i = 1; i <= 8; i++) {
    if (input === window[`KNOB_${i}`])   { ui.setKnob(i, midi.getValue(`KNOB_${i}`));   return; }
    if (input === window[`SLIDER_${i}`]) { ui.setFader(i, midi.getValue(`SLIDER_${i}`)); return; }
  }
}