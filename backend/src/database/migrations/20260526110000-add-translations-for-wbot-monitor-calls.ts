import { QueryInterface } from "sequelize";
import {
  translationsDown,
  TranslationsMap,
  translationsUp
} from "../translationFunctions";

const translationsMap: TranslationsMap = {
  en: {
    "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you":
      "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you",
    "Missed voice/video call": "Missed voice/video call"
  },
  de: {
    "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you":
      "Sprach- und Videoanrufe sind fuer dieses WhatsApp-Konto deaktiviert, bitte senden Sie eine Textnachricht. Danke",
    "Missed voice/video call": "Verpasster Sprach-/Videoanruf"
  },
  fr: {
    "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you":
      "Les appels vocaux et video sont desactives pour ce compte WhatsApp, veuillez envoyer un message texte. Merci",
    "Missed voice/video call": "Appel vocal/video manque"
  },
  pt: {
    "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you":
      "As chamadas de voz e video estao desativadas para este WhatsApp, por favor envie uma mensagem de texto. Obrigado",
    "Missed voice/video call": "Chamada de voz/video perdida"
  },
  pt_PT: {
    "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you":
      "As chamadas de voz e video estao desativadas para este WhatsApp, por favor envie uma mensagem de texto. Obrigado",
    "Missed voice/video call": "Chamada de voz/video perdida"
  },
  id: {
    "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you":
      "Panggilan suara dan video dinonaktifkan untuk akun WhatsApp ini, silakan kirim pesan teks. Terima kasih",
    "Missed voice/video call": "Panggilan suara/video terlewat"
  },
  it: {
    "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you":
      "Le chiamate vocali e video sono disabilitate per questo account WhatsApp, invia un messaggio di testo. Grazie",
    "Missed voice/video call": "Chiamata vocale/video persa"
  },
  es: {
    "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you":
      "Las llamadas de voz y video estan deshabilitadas para esta cuenta de WhatsApp, por favor envie un mensaje de texto. Gracias",
    "Missed voice/video call": "Llamada de voz/video perdida"
  }
};

export default {
  up: async (queryInterface: QueryInterface) => {
    return translationsUp(translationsMap, queryInterface);
  },
  down: async (queryInterface: QueryInterface) => {
    return translationsDown(translationsMap, queryInterface);
  }
};
