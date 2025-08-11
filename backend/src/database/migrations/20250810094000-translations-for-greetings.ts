import { QueryInterface } from "sequelize";
import {
  translationsDown,
  TranslationsMap,
  translationsUp
} from "../translationFunctions";

const translationsMap: TranslationsMap = {
  en: {
    Hello: "Hello",
    "Good morning": "Good morning",
    "Good afternoon": "Good afternoon",
    "Good evening": "Good evening"
  },
  pt: {
    Hello: "Olá",
    "Good morning": "Bom dia",
    "Good afternoon": "Boa tarde",
    "Good evening": "Boa noite"
  },
  pt_PT: {
    Hello: "Olá",
    "Good morning": "Bom dia",
    "Good afternoon": "Boa tarde",
    "Good evening": "Boa noite"
  },
  id: {
    Hello: "Halo",
    "Good morning": "Selamat pagi",
    "Good afternoon": "Selamat sore",
    "Good evening": "Selamat malam"
  },
  it: {
    Hello: "Ciao",
    "Good morning": "Buongiorno",
    "Good afternoon": "Buon pomeriggio",
    "Good evening": "Buonasera"
  },
  es: {
    Hello: "Hola",
    "Good morning": "Buenos días",
    "Good afternoon": "Buenas tardes",
    "Good evening": "Buenas noches"
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
