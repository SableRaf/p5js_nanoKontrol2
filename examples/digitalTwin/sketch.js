// KORG nanoKONTROL2 — interactive digital twin

let midi;
let ui;

const held = {};

// Per-channel toggle state.
const TOGGLE_STATES = {
  SOLO: new Array(8).fill(false),
  MUTE: new Array(8).fill(false),
  REC:  new Array(8).fill(false),
};


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
    for (const [name, state] of Object.entries(TOGGLE_STATES)) {
      midi.setLed(`${name}_${i}`, state[i-1]);
    }
  }
  for (const name of Object.keys(held)) {
    if (midi.getControl(name)?.hasLed) midi.setLed(name, !!held[name]);
  }
}

// ── MIDI callbacks ────────────────────────────────────────────────────────────

function deviceConnected() {
  ui.setPowerLed(true);
}

function deviceDisconnected() {
  ui.setPowerLed(false);
}

function buttonPressed() {
  const { name, type, hasLed } = midi.input;

  if (type === 'toggle') {
    const [group, idx] = [name.slice(0, -2), Number(name.slice(-1)) - 1];
    TOGGLE_STATES[group][idx] = !TOGGLE_STATES[group][idx];
    midi.setLed(name, TOGGLE_STATES[group][idx]);
    ui.setChannelButton(group, idx + 1, TOGGLE_STATES[group][idx]);
    return;
  } else {
    held[name] = true;
    if (hasLed) midi.setLed(name, true);
    ui.pressButton(name);
  }

  
}

function buttonReleased() {
  const { name, hasLed } = midi.input;
  held[name] = false;
  if (hasLed) midi.setLed(name, false);
  ui.releaseButton(name);
}

function inputChanged() {
  const { name } = midi.input;
  for (let i = 1; i <= 8; i++) {
    if (name === `KNOB_${i}`)   { ui.setKnob(i, midi.getValue(`KNOB_${i}`));   return; }
    if (name === `SLIDER_${i}`) { ui.setFader(i, midi.getValue(`SLIDER_${i}`)); return; }
  }
}