// ── SVG UI manager ────────────────────────────────────────────────────────────

class NanoKontrolUI {
  #knobs      = [];
  #faders     = [];
  #transport  = {};
  #nav        = {};
  #channelBtns = { SOLO: [], MUTE: [], REC: [] };
  #powerLed;

  #NAV_IDS = {
    PREV_TRACK: 'btn-prev-track', NEXT_TRACK: 'btn-next-track',
    SET_MARKER: 'btn-set-marker', PREV_MARKER: 'btn-prev-marker', NEXT_MARKER: 'btn-next-marker',
  };
  #TRANSPORT_IDS = {
    CYCLE: 'btn-cycle', REW: 'btn-rew', FF: 'btn-ff',
    STOP: 'btn-stop',   PLAY: 'btn-play', REC: 'btn-rec',
  };

  constructor(containerSelector, svgPath) {
    this._container = containerSelector;
    this._svgPath   = svgPath;
  }

  // SVG is fetched and injected as inline HTML so its elements become part of
  // the live DOM and can be queried and mutated like any other element.
  // Element refs are cached here so later updates never query the DOM again.
  async load() {
    const svg = await fetch(this._svgPath).then(r => r.text());
    select(this._container).elt.innerHTML = svg;

    for (let i = 1; i <= 8; i++) {
      this.#channelBtns.SOLO[i-1] = select(`#solo-${i}`);
      this.#channelBtns.MUTE[i-1] = select(`#mute-${i}`);
      this.#channelBtns.REC[i-1]  = select(`#rec-${i}`);
      this.#knobs[i-1]  = select(`#knob-${i}`);
      this.#faders[i-1] = select(`#fader-${i}`);
    }
    this.#powerLed = select('#power-led');
    for (const [name, id] of Object.entries(this.#TRANSPORT_IDS)) this.#transport[name] = select(`#${id}`);
    for (const [name, id] of Object.entries(this.#NAV_IDS))       this.#nav[name]       = select(`#${id}`);
  }

  // Knobs power up at an undefined hardware position, so we draw them at zero
  // to avoid a stale indicator until the user touches a knob.
  resetKnobs() {
    for (let i = 1; i <= 8; i++) this.setKnob(i, 0);
  }

  // The indicator is a line endpoint rotated around the knob center, with a
  // small dead-zone at the bottom so the range reads as a swept arc, not a
  // full circle. i is 1-based.
  setKnob(i, val) {
    const angle = map(val, 0, 1, HALF_PI + 0.5, TWO_PI + HALF_PI - 0.5);
    this.#knobs[i-1].attribute('x2', 54 + cos(angle) * 12);
    this.#knobs[i-1].attribute('y2', 35 + sin(angle) * 12);
  }

  // val is inverted (1 − val) because SVG y increases downward, but fader
  // value increases upward. i is 1-based.
  setFader(i, val) {
    this.#faders[i-1].attribute('y', 89 + 111 * (1 - val));
  }

  // The power LED reflects WebMidi output availability, not just whether the
  // page loaded — it turns off if the device is unplugged mid-session.
  setPowerLed(isConnected) {
    this.#powerLed.elt.classList.toggle('connected', isConnected);
  }

  // classList is used directly because p5's addClass/removeClass writes to
  // element.className as a string, which SVG exposes as a read-only getter.
  // name = 'SOLO' | 'MUTE' | 'REC', i is 1-based.
  setChannelButton(name, i, active) {
    this.#channelBtns[name][i-1].elt.classList.toggle('active', active);
  }

  pressButton(name) {
    if (this.#transport[name]) this.#transport[name].elt.classList.add('active');
    else if (this.#nav[name]) this.#nav[name].elt.classList.add('held');
  }

  releaseButton(name) {
    if (this.#transport[name]) this.#transport[name].elt.classList.remove('active');
    else if (this.#nav[name]) this.#nav[name].elt.classList.remove('held');
  }
}
