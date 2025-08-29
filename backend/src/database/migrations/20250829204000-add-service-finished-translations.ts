import { QueryInterface } from "sequelize";
import {
  translationsUp,
  translationsDown,
  TranslationsMap
} from "../translationFunctions";

const translationsMap: TranslationsMap = {
  en: {
    "Service finished": "Service finished"
  },
  de: {
    "Service finished": "Dienst beendet"
  },
  fr: {
    "Service finished": "Service terminé"
  },
  pt: {
    "Service finished": "Atendimento finalizado"
  },
  pt_PT: {
    "Service finished": "Atendimento finalizado"
  },
  id: {
    "Service finished": "Layanan selesai"
  },
  it: {
    "Service finished": "Servizio terminato"
  },
  es: {
    "Service finished": "Servicio finalizado"
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
