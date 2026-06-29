// Adapted from https://ronikaufman.github.io/color_pals/
const palettes = [
  ["#f398c3", "#f44e24", "#f4d730", "#23b247", "#2a76d3"],
  ["#fef9c6", "#ffcc4d", "#f5b800", "#56a1c4", "#4464a1", "#ee726b", "#df5f50", "#5a3034"],
  ["#4464a1", "#62b6de", "#b3dce0", "#ffc5c7", "#ee726b", "#cd1440"],
  ["#f2eb8a", "#fed000", "#fc8405", "#ed361a", "#4464a1", "#f398c3", "#cf3895", "#6d358a", "#06b4b0", "#4b8a5f"],
  ["#abcd5e", "#29ac9f", "#14976b", "#b3dce0", "#62b6de", "#2b67af", "#f589a3", "#ef562f", "#fc8405", "#f9d531"],
  ["#584594", "#e488b7", "#d74c41", "#f0d235", "#36ad63", "#69bcea"],
  ["#F59FAC", "#F2C800", "#72ADDC", "#BC71BA", "#62B100", "#F5B200", "#CC530A"] // Waxy Corn, Dark Orange
]

let paletteIndex = 0;  // which palette is active
let paletteOffset = 0; // shifts which color each character gets

// Cycle the color offset within the current palette.
function offsetColor(step) {
  const len = palettes[paletteIndex].length;
  paletteOffset = (paletteOffset + step % len + len) % len;
}

// Switch to another palette and reset the color offset.
function offsetPalette(step) {
  paletteIndex = (paletteIndex + step % palettes.length + palettes.length) % palettes.length;
  paletteOffset = 0;
}