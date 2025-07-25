/**
 * Encodes a string for use in a URL, while preserving certain characters.
 * This function encodes the string using encodeURIComponent,
 * but then replaces specific encoded characters
 * to ensure they remain intact.
 *
 * @param {string} str - The string to encode.
 * @return {string} - The encoded string with specific characters preserved.
 */
export function URLCharEncoder(str) {
  return encodeURIComponent(str)
    .replace(/%2F/g, "/")
    .replace(/%3A/g, ":")
    .replace(/%2E/g, ".");
}
