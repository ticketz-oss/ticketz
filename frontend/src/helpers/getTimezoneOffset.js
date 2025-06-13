export function getTimezoneOffset() {
  const offset = new Date().getTimezoneOffset();
  const sign = offset <= 0 ? '+' : '-';
  const pad = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
  return sign + pad(offset / 60) + ':' + pad(offset % 60);
}
