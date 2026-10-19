import { useEffect, useState } from "react";
import { i18n } from "../translate/i18n";

export const writingLanguage = language => {
  // Our Portuguese dictionary is Brazilian; pt_PT is the separate Portugal UI.
  const locale = (language || "pt").replace(/_/g, "-");
  if (locale.toLowerCase() === "pt") return "pt-BR";
  try {
    return Intl.getCanonicalLocales(locale)[0] || "pt-BR";
  } catch {
    return "pt-BR";
  }
};

const currentLanguage = () =>
  writingLanguage(i18n.resolvedLanguage || i18n.language);

export default function useWritingAssistance() {
  const [language, setLanguage] = useState(currentLanguage);

  useEffect(() => {
    const updateLanguage = () => setLanguage(currentLanguage());
    i18n.on?.("languageChanged", updateLanguage);
    updateLanguage();
    return () => i18n.off?.("languageChanged", updateLanguage);
  }, []);

  // Let the browser/keyboard offer corrections while typing. Actual automatic
  // replacement depends on its dictionary/settings; no remote text service.
  return {
    lang: language,
    spellCheck: true,
    autoCorrect: "on",
    autoCapitalize: "sentences"
  };
}
