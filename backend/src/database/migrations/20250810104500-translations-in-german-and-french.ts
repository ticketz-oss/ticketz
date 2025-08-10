import { QueryInterface } from "sequelize";
import {
  translationsDown,
  TranslationsMap,
  translationsUp
} from "../translationFunctions";

const translationsMap: TranslationsMap = {
  de: {
    "Service completed": "Dienst abgeschlossen",
    Hello: "Hallo",
    "Good morning": "Guten Morgen",
    "Good afternoon": "Guten Tag",
    "Good evening": "Guten Abend",
    "Please rate our service": "Bitte bewerten Sie unseren Service",
    "Send a rating from 1 to 5": "Senden Sie eine Bewertung von 1 bis 5",
    "Send *\\`!\\`* to return to the service":
      "Senden Sie *\\`!\\`* um zum Service zurückzukehren",
    "*Automated message*": "*Automatisierte Nachricht*",
    "Our system only accepts files up to ":
      "Unser System akzeptiert nur Dateien bis zu ",
    "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.":
      "Wir haben eine Datei erhalten, die das Größenlimit überschreitet. Falls nötig, kann sie in der WhatsApp-Anwendung abgerufen werden.",
    "Back to Main Menu": "Zurück zum Hauptmenü",
    "Service reopened": "Dienst wiedereröffnet",
    "Rating Cancelled": "Bewertung abgebrochen",
    "We are out of office hours right now":
      "Wir befinden uns derzeit außerhalb der Geschäftszeiten"
  },
  fr: {
    "Service completed": "Service terminé",
    Hello: "Bonjour",
    "Good morning": "Bonjour",
    "Good afternoon": "Bon après-midi",
    "Good evening": "Bonsoir",
    "Please rate our service": "Veuillez évaluer notre service",
    "Send a rating from 1 to 5": "Envoyez une note de 1 à 5",
    "Send *\\`!\\`* to return to the service":
      "Envoyez *\\`!\\`* pour revenir au service",
    "*Automated message*": "*Message automatisé*",
    "Our system only accepts files up to ":
      "Notre système n\\'accepte que des fichiers jusqu\\'à ",
    "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.":
      "Nous avons reçu un fichier dépassant la limite de taille. Si nécessaire, il peut être obtenu dans l\\'application WhatsApp.",
    "Back to Main Menu": "Retour au menu principal",
    "Service reopened": "Service rouvert",
    "Rating Cancelled": "Évaluation annulée",
    "We are out of office hours right now":
      "Nous sommes actuellement hors des heures de bureau"
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
