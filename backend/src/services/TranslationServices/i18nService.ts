import i18next from "i18next";
import { logger } from "../../utils/logger";
import TranslationsSequelize from "./TranslationsSequelize";
import Whatsapp from "../../models/Whatsapp";
import Contact from "../../models/Contact";
import Company from "../../models/Company";
import Translation from "../../models/Translation";
import Ticket from "../../models/Ticket";
import { GetCompanySetting } from "../../helpers/CheckSettings";

const i18n = i18next.use(TranslationsSequelize);

let defaultLanguage = "en";

export async function getUniqueLanguages() {
  const languages = await Translation.findAll({
    attributes: ["language"],
    group: ["language"]
  });
  return languages.map((entry: any) => entry.language);
}

export async function initializeI18n() {
  defaultLanguage = await GetCompanySetting(
    1,
    "systemDefaultLanguage",
    process.env.DEFAULT_LANGUAGE || "en"
  );
  const languages = await getUniqueLanguages();
  logger.trace({ languages }, "i18n: Unique languages found");
  return i18n.init({
    fallbackLng: "en",
    ns: ["backend"],
    defaultNS: "backend",
    backend: {},
    supportedLngs: languages,
    preload: languages
  });
}

const i18nReady = new Promise<void>(resolve => {
  initializeI18n().then(() => {
    resolve();
    logger.trace("i18n initialized");
  });
});

export async function reloadTranslations() {
  return i18n.reloadResources().then(() => {
    logger.trace("i18n translations reloaded successfully");
  });
}

// eslint-disable-next-line no-underscore-dangle
export function _t(
  key: string,
  lngSource: Ticket | Contact | Whatsapp | Company | string
) {
  let lng: string;

  if (typeof lngSource === "string") {
    lng = lngSource;
  } else if (lngSource instanceof Ticket) {
    lng =
      lngSource.contact?.language ||
      lngSource.whatsapp?.language ||
      lngSource.company?.language;
  } else if (lngSource instanceof Whatsapp) {
    lng = lngSource.language || lngSource.company?.language;
  } else if (lngSource instanceof Contact) {
    lng = lngSource.language || lngSource.company?.language;
  } else {
    lng = lngSource.language;
  }

  if (!lng) {
    lng = defaultLanguage;
  }

  return i18n.t(key, { lng });
}

export { i18n, i18nReady };
