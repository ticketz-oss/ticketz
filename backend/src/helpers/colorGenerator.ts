/* eslint-disable no-bitwise */

type Color = {
  r: number;
  g: number;
  b: number;
};

function getHexColor({ r, g, b }: Color): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Function to hash a string to a number
function hashStringToNumber(str: string) {
  if (!str) {
    return 0x7f7f7f; // 50% of all colors
  }

  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Function to generate a color from a hash
function generateColorFromHash(hash: number): Color {
  // Normalize the hash value
  const normalizedHash = Math.abs(hash) % 16777215; // 16777215 is 0xFFFFFF
  const r = (normalizedHash & 0xff0000) >> 16;
  const g = (normalizedHash & 0x00ff00) >> 8;
  const b = normalizedHash & 0x0000ff;
  return { r, g, b };
}

// Function to get the luminance of a color
function getLuminance({ r, g, b }: Color) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Function to adjust color for contrast
function adjustColorForContrast(color: Color): Color {
  const luminance = getLuminance(color);
  const thresholdLow = 50; // Luminance threshold for dark colors
  const thresholdHigh = 200; // Luminance threshold for bright colors

  let { r, g, b } = color;
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
  return { r, g, b };
}

/**
 * Generates a color based on a string identifier.
 * The color is generated in such a way that it is visually distinct and has good contrast.
 *
 * @param {string} identifier - The string identifier to generate a color from.
 * @return {string} - The generated color in hex format (e.g., "#ff5733").
 */
export function generateColor(identifier: string): string {
  const hash = hashStringToNumber(identifier);
  let color = generateColorFromHash(hash);
  const luminance = getLuminance(color);
  const thresholdLow = 50; // Luminance threshold for dark colors
  const thresholdHigh = 200; // Luminance threshold for bright colors

  if (luminance < thresholdLow || luminance > thresholdHigh) {
    color = adjustColorForContrast(color);
  }

  return getHexColor(color);
}
