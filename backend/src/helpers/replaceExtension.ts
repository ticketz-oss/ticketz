/**
 * Replace the file extension of a given filename.
 *
 * Up to 4 characters are considered for the original extension.
 *
 * @param {string} filename - The original filename.
 * @param {string} newExtension - The new file extension (without the dot).
 * @returns {string} - The filename with the new extension.
 */
export function replaceFileExtension(
  filename: string,
  newExtension: string
): string {
  return filename.replace(/(\.[^/.]{0,4})?$/, `.${newExtension}`);
}
