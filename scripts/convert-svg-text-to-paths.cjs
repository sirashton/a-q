const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const fontPath = path.join(__dirname, '../assets/ZillaSlab-Regular.ttf');
const svgPath = path.join(__dirname, '../assets/logo.svg');
const outputPath = svgPath;

// Load the font
const font = opentype.loadSync(fontPath);

// Read the SVG
let svg = fs.readFileSync(svgPath, 'utf8');

// Text to convert
const text = 'a+q';
const fontSize = 380;
const x = 512;
const y = 580;
const letterSpacing = -0.02; // -0.02em

// Convert text to paths
const paths = [];
let currentX = x;

// Calculate text width for centering
let totalWidth = 0;
for (let i = 0; i < text.length; i++) {
  const char = text[i];
  if (char === '+') {
    const glyph = font.charToGlyph('+');
    totalWidth += glyph.advanceWidth * (fontSize / font.unitsPerEm);
  } else {
    const glyph = font.charToGlyph(char);
    totalWidth += glyph.advanceWidth * (fontSize / font.unitsPerEm);
  }
  if (i < text.length - 1) {
    totalWidth += letterSpacing * fontSize;
  }
}

// Start from center and work left
currentX = x - totalWidth / 2;

for (let i = 0; i < text.length; i++) {
  const char = text[i];
  const glyph = font.charToGlyph(char);
  
  // Get the path
  const path = glyph.getPath(currentX, y, fontSize);
  const pathSVG = path.toSVG(2);
  
  // Extract just the path data (d attribute) from the SVG string
  const pathDataMatch = pathSVG.match(/d="([^"]+)"/);
  if (pathDataMatch) {
    paths.push(pathDataMatch[1]);
  }
  
  // Move to next character position
  currentX += glyph.advanceWidth * (fontSize / font.unitsPerEm);
  if (i < text.length - 1) {
    currentX += letterSpacing * fontSize;
  }
}

// Combine all paths
const combinedPath = paths.join(' ');

// Replace the text element with path
const pathElement = `<path d="${combinedPath}" fill="white"/>`;
const textRegex = /<text[^>]*>[\s\S]*?<\/text>/;
svg = svg.replace(textRegex, pathElement);

// Remove the font-face definition since we don't need it anymore
svg = svg.replace(/<style>[\s\S]*?<\/style>/s, '');

// Write the updated SVG
fs.writeFileSync(outputPath, svg, 'utf8');
console.log('✅ Converted SVG text to paths');
console.log(`   Updated: ${outputPath}`);

