// Press the Play or Stop button on the nanoKONTROL2 
// to change the background color of the canvas

let midi;

function setup() {
  createCanvas(600, 600);
  midi = new NanoKontrol2();
  background(176);
}

function buttonPressed() {
  if (midi.input.name === 'PLAY') {
    background("lime");
    console.log('Play button pressed');
  }
  if (midi.input.name === 'STOP') {
    background("red");
    console.log('Stop button pressed');
  }
}