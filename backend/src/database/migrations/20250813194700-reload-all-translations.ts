import { QueryInterface } from "sequelize";
import {
  translationsDown,
  TranslationsMap,
  translationsUp
} from "../translationFunctions";

const translationsMap: TranslationsMap = {
  en: {
    language: "English",
    "Service completed": "Service completed",
    Hello: "Hello",
    "Good morning": "Good morning",
    "Good afternoon": "Good afternoon",
    "Good evening": "Good evening",
    "Please rate our service": "Please rate our service",
    "Send a rating from 1 to 5": "Send a rating from 1 to 5",
    "Send *`!`* to return to the service":
      "Send *`!`* to return to the service",
    "*Automated message*": "*Automated message*",
    "Our system only accepts files up to ":
      "Our system only accepts files up to ",
    "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.":
      "We received a file beyond the size limit. If necessary, it can be obtained in the WhatsApp application.",
    "Back to Main Menu": "Back to Main Menu",
    "Service reopened": "Service reopened",
    "Rating Cancelled": "Rating Cancelled",
    "We are out of office hours right now":
      "We are out of office hours right now"
  },
  de: {
    language: "Deutsch",
    "Service completed": "Dienst abgeschlossen",
    Hello: "Hallo",
    "Good morning": "Guten Morgen",
    "Good afternoon": "Guten Tag",
    "Good evening": "Guten Abend",
    "Please rate our service": "Bitte bewerten Sie unseren Service",
    "Send a rating from 1 to 5": "Senden Sie eine Bewertung von 1 bis 5",
    "Send *`!`* to return to the service":
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
    "Send *`!`* to return to the service":
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
  },
  pt: {
    language: "Português Brasileiro",
    "Service completed": "Atendimento concluído",
    Hello: "Olá",
    "Good morning": "Bom dia",
    "Good afternoon": "Boa tarde",
    "Good evening": "Boa noite",
    "Please rate our service": "Por favor, avalie nosso atendimento",
    "Send a rating from 1 to 5": "Envie uma avaliação de 1 a 5",
    "Send *`!`* to return to the service":
      "Envie *`!`* para retornar ao atendimento",
    "*Automated message*": "*Mensagem automatizada*",
    "Our system only accepts files up to ":
      "Nosso sistema aceita apenas arquivos de até ",
    "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.":
      "Recebemos um arquivo além do limite de tamanho. Se necessário, ele pode ser obtido no aplicativo WhatsApp.",
    "Back to Main Menu": "Voltar ao menu principal",
    "Service reopened": "Atendimento reaberto",
    "Rating Cancelled": "Avaliação cancelada",
    "We are out of office hours right now":
      "Estamos fora do horário de expediente no momento"
  },
  pt_PT: {
    language: "Português Europeu",
    "Service completed": "Atendimento concluído",
    Hello: "Olá",
    "Good morning": "Bom dia",
    "Good afternoon": "Boa tarde",
    "Good evening": "Boa noite",
    "Please rate our service": "Por favor, avalie o nosso atendimento",
    "Send a rating from 1 to 5": "Envie uma avaliação de 1 a 5",
    "Send *`!`* to return to the service":
      "Envie *`!`* para voltar ao atendimento",
    "*Automated message*": "*Mensagem automatizada*",
    "Our system only accepts files up to ":
      "O nosso sistema aceita apenas ficheiros até ",
    "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.":
      "Recebemos um ficheiro além do limite de tamanho. Se necessário, pode ser obtido na aplicação WhatsApp.",
    "Back to Main Menu": "Voltar ao menu principal",
    "Service reopened": "Atendimento reaberto",
    "Rating Cancelled": "Avaliação cancelada",
    "We are out of office hours right now":
      "Estamos fora do horário de expediente neste momento"
  },
  id: {
    language: "Bahasa Indonesia",
    "Service completed": "Layanan selesai",
    Hello: "Halo",
    "Good morning": "Selamat pagi",
    "Good afternoon": "Selamat sore",
    "Good evening": "Selamat malam",
    "Please rate our service": "Silakan beri penilaian untuk layanan kami",
    "Send a rating from 1 to 5": "Kirim penilaian dari 1 hingga 5",
    "Send *`!`* to return to the service":
      "Send *`!`* to return to the service",
    "*Automated message*": "*Pesan otomatis*",
    "Our system only accepts files up to ":
      "Sistem kami hanya menerima file hingga ",
    "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.":
      "Kami menerima file yang melebihi batas ukuran. Jika diperlukan, file tersebut dapat diperoleh di aplikasi WhatsApp.",
    "Back to Main Menu": "Kembali ke Menu Utama",
    "Service reopened": "Layanan dibuka kembali",
    "Rating Cancelled": "Penilaian dibatalkan",
    "We are out of office hours right now":
      "Kami sedang di luar jam kerja saat ini"
  },
  it: {
    language: "Italiano",
    "Service completed": "Servizio completato",
    Hello: "Ciao",
    "Good morning": "Buongiorno",
    "Good afternoon": "Buon pomeriggio",
    "Good evening": "Buonasera",
    "Please rate our service": "Per favore valuta il nostro servizio",
    "Send a rating from 1 to 5": "Invia una valutazione da 1 a 5",
    "Send *`!`* to return to the service":
      "Invia *`!`* per tornare al servizio",
    "*Automated message*": "*Messaggio automatico*",
    "Our system only accepts files up to ":
      "Il nostro sistema accetta solo file fino a ",
    "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.":
      "Abbiamo ricevuto un file oltre il limite di dimensione. Se necessario, può essere ottenuto nell\\'applicazione WhatsApp.",
    "Back to Main Menu": "Torna al menu principale",
    "Service reopened": "Servizio riaperto",
    "Rating Cancelled": "Valutazione annullata",
    "We are out of office hours right now":
      "Siamo fuori dall\\'orario di lavoro in questo momento"
  },
  es: {
    language: "Español",
    "Service completed": "Servicio completado",
    Hello: "Hola",
    "Good morning": "Buenos días",
    "Good afternoon": "Buenas tardes",
    "Good evening": "Buenas noches",
    "Please rate our service": "Por favor, califique nuestro servicio",
    "Send a rating from 1 to 5": "Envíe una calificación de 1 a 5",
    "Send *`!`* to return to the service":
      "Envíe *`!`* para regresar al servicio",
    "*Automated message*": "*Mensaje automatizado*",
    "Our system only accepts files up to ":
      "Nuestro sistema solo acepta archivos de hasta ",
    "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.":
      "Recibimos un archivo que supera el límite de tamaño. Si es necesario, puede obtenerse en la aplicación WhatsApp.",
    "Back to Main Menu": "Volver al menú principal",
    "Service reopened": "Servicio reabierto",
    "Rating Cancelled": "Calificación cancelada",
    "We are out of office hours right now":
      "Estamos fuera del horario de atención en este momento"
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
