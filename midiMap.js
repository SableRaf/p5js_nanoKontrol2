// nanoKONTROL2 control map — CC numbers per the unit's default scene.
const nano = new MidiMapper({
  // Faders (top row, left → right)
  0: 'fader1', 1: 'fader2', 2: 'fader3', 3: 'fader4',
  4: 'fader5', 5: 'fader6', 6: 'fader7', 7: 'fader8',
  // Knobs
  16: 'knob1', 17: 'knob2', 18: 'knob3', 19: 'knob4',
  20: 'knob5', 21: 'knob6', 22: 'knob7', 23: 'knob8',
  // Solo / Mute / Rec per channel
  32: 'solo1', 33: 'solo2', 34: 'solo3', 35: 'solo4',
  36: 'solo5', 37: 'solo6', 38: 'solo7', 39: 'solo8',
  48: 'mute1', 49: 'mute2', 50: 'mute3', 51: 'mute4',
  52: 'mute5', 53: 'mute6', 54: 'mute7', 55: 'mute8',
  64: 'rec1', 65: 'rec2', 66: 'rec3', 67: 'rec4',
  68: 'rec5', 69: 'rec6', 70: 'rec7', 71: 'rec8',
  // Transport / navigation
  41: 'play', 42: 'stop', 43: 'rw', 44: 'ff', 45: 'rec', 46: 'cycle',
  58: 'prevTrk', 59: 'nextTrk',
  60: 'setMrk', 61: 'prevMrk', 62: 'nextMrk',
});