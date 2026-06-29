// KORG nanoKONTROL2 — interactive digital twin

// This code assumes the SOLO, MUTE, and REC buttons are 
// set to "momentary" in the KORG Kontrol Editor, and
// that the LED mode is set to "external" (so the LEDs 
// are controlled by the software, not the hardware).

let nano;
let ui;

// The latching button groups, defined once and reused for setup + UI sync.
const SOLO = ['SOLO_1','SOLO_2','SOLO_3','SOLO_4','SOLO_5','SOLO_6','SOLO_7','SOLO_8'];
const MUTE = ['MUTE_1','MUTE_2','MUTE_3','MUTE_4','MUTE_5','MUTE_6','MUTE_7','MUTE_8'];
const REC  = ['REC_1','REC_2','REC_3','REC_4','REC_5','REC_6','REC_7','REC_8'];

async function setup() {
  noCanvas();

  ui = new NanoKontrolUI('main', 'layout.svg');
  await ui.load();
  ui.resetKnobs();

  nano = new NanoKontrol2({ debugLogs: true, statusLabel: true });

  // Let the library manage latched state and hardware LEDs.
  // SOLO is a mutually-exclusive radio group; MUTE and REC latch independently.
  nano.setType(SOLO, 'radio');
  nano.setType(MUTE, 'toggle');
  nano.setType(REC, 'toggle');
}

// Mirror every latching button's library-managed state onto the digital twin.
function syncLatchingUi() {
  for (const name of [...SOLO, ...MUTE, ...REC]) {
    ui.setChannelButtonByName(name, nano.isToggled(name));
  }
}

// ── MIDI callbacks ────────────────────────────────────────────────────────────

function deviceConnected() {
  ui.setPowerIndicator(true);
}

function deviceDisconnected() {
  ui.setPowerIndicator(false);
  ui.setAllLeds(false);
}

function buttonPressed(btn) {
  // For latching buttons (toggle/radio) the library tracks state and drives the
  // hardware LED; we just mirror the resulting state onto the digital twin.
  if (nano.getType(btn) === 'momentary') {
    ui.pressButton(btn);
  } else {
    syncLatchingUi(); // radio may have flipped a peer, so refresh the whole group
  }
}

function buttonReleased(btn) {
  if (nano.getType(btn) === 'momentary') ui.releaseButton(btn);
}

function controlChanged(control) {
  for (let i = 1; i <= 8; i++) {
    if (control === `KNOB_${i}`)   { ui.setKnob(i, nano.getValue(`KNOB_${i}`));   return; }
    if (control === `SLIDER_${i}`) { ui.setFader(i, nano.getValue(`SLIDER_${i}`)); return; }
  }
}