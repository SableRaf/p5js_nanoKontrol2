// Toggle the LEDs on the nanoKONTROL2 by pressing the buttons

let nano;

function setup() {
  createCanvas(600, 600);
  background(176);
  nano = new NanoKontrol2();

  drawCaption(`
    Press any button on the nanoKONTROL2 to light it up \n
    (The buttons under Track and Marker do NOT have LEDs) \n
    Press the SET button to turn off all LEDs
  `);
}

function buttonPressed(btn) {
  // Turn off all LEDs when the SET button is pressed
  if (btn === SET_MARKER) {
    nano.setAllLeds(false);
  }

  // If the button doesn't have an LED, we don't need to do anything else
  if (!nano.hasLed(btn)) return;

  // Light up the button that was pressed
  nano.setLed(btn, true);
}

function drawCaption(s){
  push();
  textAlign(LEFT, TOP);
  textSize(16);
  translate(20, 20);
  text(s, 0, 0);
  pop();
}