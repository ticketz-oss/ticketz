import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { messages } from "./languages";

i18n.use(LanguageDetector).init({
	debug: false,
	defaultNS: ["translations"],
	lng: localStorage.getItem("language") ?? "en",
	fallbackLng: "pt",
	ns: ["translations"],
	resources: messages,
});

export { i18n };
