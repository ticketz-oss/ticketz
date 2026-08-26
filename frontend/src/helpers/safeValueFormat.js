import { i18n } from "../translate/i18n";

// Maps the i18n language code (e.g. "pt", "pt_PT", "en") to a locale
// accepted by Intl.NumberFormat (e.g. "pt-BR", "pt-PT", "en").
const getLocale = () =>
  (i18n.resolvedLanguage || i18n.language || "en").replace("_", "-").trim();

export function safeValueFormat(value, currencyCode) {
  if (typeof value === "number") {
    try {
      return new Intl.NumberFormat(getLocale(), {
        style: "currency",
        currency: currencyCode
      }).format(value);
    } catch (e) {
      return value.toString();
    }
  }
  return "-";
}
