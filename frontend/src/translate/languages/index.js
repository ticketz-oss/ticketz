import { messages as portugueseMessages } from "./pt";
import { messages as portuguesePortugalMessages } from "./pt_PT";
import { messages as englishMessages } from "./en";
import { messages as spanishMessages } from "./es";
import { messages as frenchMessages } from "./fr";
import { messages as germanMessages } from "./de";
import { messages as italianMessages } from "./it";
import { messages as indonesianMessages } from "./id";
import { schedulingMessages } from "./scheduling";
import { conversasMessages } from "./conversas";
import { announcementsMessages } from "./announcements";
import { loginExperienceMessages } from "./loginExperience";
import { socialLoginMessages } from "./socialLogin";

import { themeMessages } from "./themes";
import { subscriptionNoticeMessages } from "./subscriptionNotice";

import { whatsappProvidersMessages } from "./whatsappProviders";
import { agentContextManagementMessages } from "./agentContextManagement";
import { welcomeTourMessages } from "./welcomeTour";
import { mobileLoginMessages } from "./mobileLogin";
import { documentationMessages } from "./documentation";

const mergeTranslations = (base, extra) => {
  const result = { ...base };
  Object.entries(extra || {}).forEach(([key, value]) => {
    result[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? mergeTranslations(result[key] || {}, value)
        : value;
  });
  return result;
};

const messages = {
  ...portugueseMessages,
  ...portuguesePortugalMessages,
  ...englishMessages,
  ...spanishMessages,
  ...frenchMessages,
  ...germanMessages,
  ...italianMessages,
  ...indonesianMessages
};

[
  schedulingMessages,
  announcementsMessages,
  conversasMessages,
  loginExperienceMessages,
  socialLoginMessages,
  themeMessages,
  subscriptionNoticeMessages,
  whatsappProvidersMessages,
  agentContextManagementMessages,
  welcomeTourMessages,
  mobileLoginMessages,
  documentationMessages
].forEach(overlay => {
  Object.entries(overlay).forEach(([language, extra]) => {
    messages[language].translations = mergeTranslations(
      messages[language].translations,
      extra
    );
  });
});

export { messages };
