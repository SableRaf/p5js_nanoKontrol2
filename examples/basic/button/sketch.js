// Press the PLAY or STOP button on the nanoKONTROL2 
// to change the background color of the canvas

let midi;

let caption = 'Press PLAY or STOP on the nanoKONTROL2';

const playColor = "#96df96";
const stopColor = "#db6074";

function setup() {
  createCanvas(600, 600);
  
  midi = new NanoKontrol2();

  background(176);
  drawCaption(caption);
}

function drawCaption(s){
  push();
  textAlign(CENTER, CENTER);
  textSize(16);
  translate(width/2, height/2);
  text(s, 0, 0);
  pop();
}

function buttonPressed() {
  const inputName = midi.input.name;
  
  if (inputName === PLAY) {
    console.log('PLAY button pressed');
    caption = 'PLAY button pressed!';
    background(playColor);
  }

  if (inputName === STOP) {
    console.log('STOP button pressed');
    caption = 'STOP button pressed!';
    background(stopColor);
  }

  drawCaption(caption);
}