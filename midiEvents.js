// MIDI wiring (WebMidi.js v3) — https://webmidijs.org/docs/
// Discovers inputs (incl. hot-plug) and feeds the shared `mapper`.

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
  });
}

function listenTo(input) {
  input.removeListener();                  // guard against double-binding
  input.addListener('controlchange', onControlChange);
}

function onControlChange(e) {
  nano.update(e.controller.number, e.rawValue);   // 0..127
}