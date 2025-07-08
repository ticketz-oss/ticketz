export function URLCharEncoder(str) {
  return str.split('').map(char => {
    // Do not encode alphanumerics, colon, or slash
    if (/^[a-zA-Z0-9]$/.test(char) || char === ':' || char === '/') {
      return char;
    }
    // Encode all other characters
    return '%' + char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
  }).join('');
}
