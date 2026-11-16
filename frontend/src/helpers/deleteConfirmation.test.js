import { getDeleteConfirmationText } from "./deleteConfirmation";
import { i18n } from "../translate/i18n";
import { messages } from "../translate/languages";

const originalLanguage = i18n.language;

afterAll(async () => {
  await i18n.changeLanguage(originalLanguage);
});

test.each(["en", "pt", "pt_PT", "es", "fr", "de", "it", "id"])(
  "identifies every record type and preserves its name in %s",
  async language => {
    await i18n.changeLanguage(language);

    for (const type of ["company", "user", "queue", "connection"]) {
      const name = "A&B <test>";
      const { title, message } = getDeleteConfirmationText(type, name);
      const translatedType = messages[language].translations.common[type];

      expect(translatedType).toBeTruthy();
      expect(title).toContain(translatedType);
      expect(title).toContain(name);
      expect(message).toContain(translatedType);
      expect(message).toContain(name);
      expect(title).not.toContain("{{");
      expect(message).not.toContain("{{");
    }
  }
);
