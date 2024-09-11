// colorGenerator.js

// Function to hash a string to a number
function hashStringToNumber(str) {
  if (!str) {
    return 0x7F7F7F;  // 50% of all colors
  }
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Function to generate a color from a hash
function generateColorFromHash(hash) {
  // Normalize the hash value
  const normalizedHash = Math.abs(hash) % 16777215; // 16777215 is 0xFFFFFF
  const r = (normalizedHash & 0xFF0000) >> 16;
  const g = (normalizedHash & 0x00FF00) >> 8;
  const b = normalizedHash & 0x0000FF;
  return { r, g, b };
}

// Function to get the luminance of a color
function getLuminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Function to adjust color for contrast
function adjustColorForContrast(r, g, b) {
  const luminance = getLuminance(r, g, b);
  const thresholdLow = 50;  // Luminance threshold for dark colors
  const thresholdHigh = 200; // Luminance threshold for bright colors

  if (luminance < thresholdLow) {
    // Lighten the color if too dark
    r = Math.min(255, r + 50);
    g = Math.min(255, g + 50);
    b = Math.min(255, b + 50);
  } else if (luminance > thresholdHigh) {
    // Darken the color if too bright
    r = Math.max(0, r - 50);
    g = Math.max(0, g - 50);
    b = Math.max(0, b - 50);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// Main function to generate color from user identifier
function generateColor(identifier) {
  const hash = hashStringToNumber(identifier);
  const { r, g, b } = generateColorFromHash(hash);
  const luminance = getLuminance(r, g, b);
  const thresholdLow = 50;  // Luminance threshold for dark colors
  const thresholdHigh = 200; // Luminance threshold for bright colors

  if (luminance < thresholdLow || luminance > thresholdHigh) {
    return adjustColorForContrast(r, g, b);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// Export the function
export { generateColor };
