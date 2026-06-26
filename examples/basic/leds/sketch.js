// Toggle the LEDs on the nanoKONTROL2 by pressing the buttons

let midi;

function setup() {
  createCanvas(600, 600);
  background(176);
  midi = new NanoKontrol2();

  drawCaption(`
    Press any button on the nanoKONTROL2 to light it up \n
    (The buttons under Track and Marker do NOT have LEDs) \n
    Press the SET button to turn off all LEDs
  `);
}

function buttonPressed() {
  const { name: inputName, hasLed } = midi.input;
  
  // Turn off all LEDs when the SET button is pressed
  if( inputName === SET_MARKER){
    midi.setAllLeds(false);
  }
  
  // If the button doesn't have an LED, we don't need to do anything else
  if (!hasLed) return;

  // Toggle the LED state for the button that was pressed
  midi.setLed(inputName, true);
}

function drawCaption(s){
  push();
  textAlign(LEFT, TOP);
  textSize(16);
  translate(20, 20);
  text(s, 0, 0);
  pop();
}