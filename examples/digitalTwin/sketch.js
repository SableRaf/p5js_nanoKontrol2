// KORG nanoKONTROL2 — interactive digital twin

// This code assumes the SOLO, MUTE, and REC buttons are 
// set to "momentary" in the KORG Kontrol Editor, and
// that the LED mode is set to "external" (so the LEDs 
// are controlled by the software, not the hardware).

let midi;
let ui;

// Toggle state keyed by control name (e.g. 'SOLO_1').
const TOGGLE_STATES = {};

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
  for (const [name, on] of Object.entries(TOGGLE_STATES)) {
    midi.setLed(name, on);
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
    TOGGLE_STATES[name] = !TOGGLE_STATES[name]; // toggle state keyed by control name (e.g. 'SOLO_1')
    midi.setLed(name, TOGGLE_STATES[name]); // mirror on hardware LED
    ui.setChannelButtonByName(name, TOGGLE_STATES[name]); // mirror on digital twin
  } else {
    if (hasLed) midi.setLed(name, true); // mirror on hardware LED
    ui.pressButton(name);
  }
}

function buttonReleased() {
  const { name, type, hasLed } = midi.input;
  if (type === 'toggle') return; // ignore release events for toggle buttons
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