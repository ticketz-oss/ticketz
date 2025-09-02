export function safeValueFormat(value, currencyCode) {
  if (typeof value === 'number') {
    try {
      return new Intl.NumberFormat(navigator.language, {
        style: 'currency',
        currency: currencyCode,
      }).format(value);
    } catch (e) {
      return value.toString();
    }
  }
  return "-";
}
