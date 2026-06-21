// MIDI wiring (WebMidi.js v3) — https://webmidijs.org/docs/
// Discovers inputs (incl. hot-plug) and feeds the shared `mapper`.

let nanoOutput = null;

window.addEventListener('DOMContentLoaded', initMidi);

function initMidi() {
  if (typeof WebMidi === 'undefined') {
    console.error('WebMidi.js not loaded — check the <script> tag');
    return;
  }
  WebMidi.enable()
    .then(onEnabled)
    .catch(err => console.error('WebMidi:', err.message));
}

function onEnabled() {
  WebMidi.inputs.forEach(listenTo);        // ports present at startup
  WebMidi.addListener('connected', e => {  // and anything plugged in later
    if (e.port.type === 'input') listenTo(e.port);
    if (e.port.type === 'output' && e.port.name.includes('nanoKONTROL2')) {
      nanoOutput = e.port;
    }
  });

  nanoOutput = WebMidi.outputs.find(o => o.name.includes('nanoKONTROL2')) ?? null;
  
  if (nanoOutput) ledStartupSequence();
}

// Cycle every button LED on then off once, stepping through them sequentially.
async function ledStartupSequence() {
  const buttonNames = [
    'cycle',
    'rw','ff','stop','play','rec',
    'rec1','rec2','rec3','rec4','rec5','rec6','rec7','rec8',
    'mute8','mute7','mute6','mute5','mute4','mute3','mute2','mute1',
    'solo1','solo2','solo3','solo4','solo5','solo6','solo7','solo8',
  ];
  const delay = ms => new Promise(r => setTimeout(r, ms));

  for (const name of buttonNames) setLed(name, false);  // start clean

  for (const name of buttonNames) {
    setLed(name, true);
    await delay(30);
    setLed(name, false);
  }

  await delay(400);

  for(let j = 0; j < 2; j++) {
    for (const name of buttonNames) setLed(name, true);
    await delay(150);
    for (const name of buttonNames) setLed(name, false);
    await delay(100);
  }
}

function listenTo(input) {
  input.removeListener();                  // guard against double-binding
  input.addListener('controlchange', onControlChange);
}

function onControlChange(e) {
  nano.update(e.controller.number, e.rawValue);   // 0..127
}

// Turn a button LED on (true) or off (false) by friendly name.
function setLed(name, on) {
  if (!nanoOutput) return;
  const cc = nano.nameToCC[name];
  if (cc === undefined) return;
  nanoOutput.sendControlChange(cc, on ? 127 : 0);
}