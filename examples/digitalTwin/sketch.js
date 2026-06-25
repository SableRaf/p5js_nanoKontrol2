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

const MOMENTARY = ['PLAY', 'STOP', 'REW', 'FF', 'REC', 'CYCLE', 'PREV_TRACK', 'NEXT_TRACK', 'SET_MARKER', 'PREV_MARKER', 'NEXT_MARKER'];

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
      midi.setLed(`${name}_${i}`, state[i-1]);
    }
  }
  for (const name of MOMENTARY) if (midi.hasLed(name)) midi.setLed(name, !!held[name]);
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
      if (input !== `${name}_${i}`) continue;
      state[i-1] = !state[i-1];
      midi.setLed(input, state[i-1]);
      ui.setChannelButton(name, i, state[i-1]);
      return;
    }
  }

  // Momentary buttons (transport + navigation)
  for (const name of MOMENTARY) {
    if (input !== name) continue;
    held[name] = true;
    if (midi.hasLed(name)) midi.setLed(name, true);
    ui.pressButton(name);
    return;
  }
}

function buttonReleased() {
  const input = midi.input;

  for (const name of MOMENTARY) {
    if (input !== name) continue;
    held[name] = false;
    if (midi.hasLed(name)) midi.setLed(name, false);
    ui.releaseButton(name);
    return;
  }
}

function inputChanged() {
  const input = midi.input;
  for (let i = 1; i <= 8; i++) {
    if (input === `KNOB_${i}`)   { ui.setKnob(i, midi.getValue(`KNOB_${i}`));   return; }
    if (input === `SLIDER_${i}`) { ui.setFader(i, midi.getValue(`SLIDER_${i}`)); return; }
  }
}