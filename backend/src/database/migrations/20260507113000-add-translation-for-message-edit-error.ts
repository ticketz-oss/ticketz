import { QueryInterface } from "sequelize";
import {
  translationsDown,
  TranslationsMap,
  translationsUp
} from "../translationFunctions";

const translationsMap: TranslationsMap = {
  en: {
    "Failed to process message edit": "Failed to process message edit"
  },
  de: {
    "Failed to process message edit":
      "Die bearbeitete Nachricht konnte nicht verarbeitet werden"
  },
  fr: {
    "Failed to process message edit":
      "Impossible de traiter la modification du message"
  },
  pt: {
    "Failed to process message edit": "Falha ao processar a edicao da mensagem"
  },
  pt_PT: {
    "Failed to process message edit": "Falha ao processar a edicao da mensagem"
  },
  id: {
    "Failed to process message edit": "Gagal memproses penyuntingan pesan"
  },
  it: {
    "Failed to process message edit":
      "Impossibile elaborare la modifica del messaggio"
  },
  es: {
    "Failed to process message edit":
      "No se pudo procesar la edicion del mensaje"
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
