import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const translations = [
        {
          language: "en",
          namespace: "backend",
          key: "language",
          value: "English"
        },
        {
          language: "en",
          namespace: "backend",
          key: "Service completed",
          value: "Service completed"
        },
        {
          language: "en",
          namespace: "backend",
          key: "Please rate our service",
          value: "Please rate our service"
        },
        {
          language: "en",
          namespace: "backend",
          key: "Send a rating from 1 to 5",
          value: "Send a rating from 1 to 5"
        },
        {
          language: "en",
          namespace: "backend",
          key: "Send *`!`* to return to the service",
          value: "Send *`!`* to return to the service"
        },
        {
          language: "en",
          namespace: "backend",
          key: "*Automated message*",
          value: "*Automated message*"
        },
        {
          language: "en",
          namespace: "backend",
          key: "Our system only accetps fils up to ",
          value: "Our system only accepts files up to "
        },
        {
          language: "en",
          namespace: "backend",
          key: "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.",
          value:
            "We received a file beyond the size limit. If necessary, it can be obtained in the WhatsApp application."
        },
        {
          language: "en",
          namespace: "backend",
          key: "Back to Main Menu",
          value: "Back to Main Menu"
        },
        {
          language: "en",
          namespace: "backend",
          key: "Service reopened",
          value: "Service reopened"
        },
        {
          language: "en",
          namespace: "backend",
          key: "Rating Cancelled",
          value: "Rating Cancelled"
        },
        {
          language: "en",
          namespace: "backend",
          key: "We are out of office hours right now",
          value: "We are out of office hours right now"
        },

        {
          language: "pt",
          namespace: "backend",
          key: "language",
          value: "Português Brasileiro"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "Service completed",
          value: "Atendimento concluído"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "Please rate our service",
          value: "Por favor, avalie nosso atendimento"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "Send a rating from 1 to 5",
          value: "Envie uma avaliação de 1 a 5"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "Send *`!`* to return to the service",
          value: "Envie *`!`* para retornar ao atendimento"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "*Automated message*",
          value: "*Mensagem automatizada*"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "Our system only accetps fils up to ",
          value: "Nosso sistema aceita apenas arquivos de até "
        },
        {
          language: "pt",
          namespace: "backend",
          key: "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.",
          value:
            "Recebemos um arquivo além do limite de tamanho. Se necessário, ele pode ser obtido no aplicativo WhatsApp."
        },
        {
          language: "pt",
          namespace: "backend",
          key: "Back to Main Menu",
          value: "Voltar ao menu principal"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "Service reopened",
          value: "Atendimento reaberto"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "Rating Cancelled",
          value: "Avaliação cancelada"
        },
        {
          language: "pt",
          namespace: "backend",
          key: "We are out of office hours right now",
          value: "Estamos fora do horário de expediente no momento"
        },

        {
          language: "pt_PT",
          namespace: "backend",
          key: "language",
          value: "Português Europeu"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "Service completed",
          value: "Atendimento concluído"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "Please rate our service",
          value: "Por favor, avalie o nosso atendimento"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "Send a rating from 1 to 5",
          value: "Envie uma avaliação de 1 a 5"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "Send *`!`* to return to the service",
          value: "Envie *`!`* para voltar ao atendimento"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "*Automated message*",
          value: "*Mensagem automatizada*"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "Our system only accetps fils up to ",
          value: "O nosso sistema aceita apenas ficheiros até "
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.",
          value:
            "Recebemos um ficheiro além do limite de tamanho. Se necessário, pode ser obtido na aplicação WhatsApp."
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "Back to Main Menu",
          value: "Voltar ao menu principal"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "Service reopened",
          value: "Atendimento reaberto"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "Rating Cancelled",
          value: "Avaliação cancelada"
        },
        {
          language: "pt_PT",
          namespace: "backend",
          key: "We are out of office hours right now",
          value: "Estamos fora do horário de expediente neste momento"
        },

        {
          language: "id",
          namespace: "backend",
          key: "language",
          value: "Bahasa Indonesia"
        },
        {
          language: "id",
          namespace: "backend",
          key: "Service completed",
          value: "Layanan selesai"
        },
        {
          language: "id",
          namespace: "backend",
          key: "Please rate our service",
          value: "Silakan beri penilaian untuk layanan kami"
        },
        {
          language: "id",
          namespace: "backend",
          key: "Send a rating from 1 to 5",
          value: "Kirim penilaian dari 1 hingga 5"
        },
        {
          language: "id",
          namespace: "backend",
          key: "*Automated message*",
          value: "*Pesan otomatis*"
        },
        {
          language: "id",
          namespace: "backend",
          key: "Our system only accetps fils up to ",
          value: "Sistem kami hanya menerima file hingga "
        },
        {
          language: "id",
          namespace: "backend",
          key: "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.",
          value:
            "Kami menerima file yang melebihi batas ukuran. Jika diperlukan, file tersebut dapat diperoleh di aplikasi WhatsApp."
        },
        {
          language: "id",
          namespace: "backend",
          key: "Back to Main Menu",
          value: "Kembali ke Menu Utama"
        },
        {
          language: "id",
          namespace: "backend",
          key: "Service reopened",
          value: "Layanan dibuka kembali"
        },
        {
          language: "id",
          namespace: "backend",
          key: "Rating Cancelled",
          value: "Penilaian dibatalkan"
        },
        {
          language: "id",
          namespace: "backend",
          key: "We are out of office hours right now",
          value: "Kami sedang di luar jam kerja saat ini"
        },

        {
          language: "it",
          namespace: "backend",
          key: "language",
          value: "Italiano"
        },
        {
          language: "it",
          namespace: "backend",
          key: "Service completed",
          value: "Servizio completato"
        },
        {
          language: "it",
          namespace: "backend",
          key: "Please rate our service",
          value: "Per favore valuta il nostro servizio"
        },
        {
          language: "it",
          namespace: "backend",
          key: "Send a rating from 1 to 5",
          value: "Invia una valutazione da 1 a 5"
        },
        {
          language: "it",
          namespace: "backend",
          key: "Send *`!`* to return to the service",
          value: "Invia *`!`* per tornare al servizio"
        },
        {
          language: "it",
          namespace: "backend",
          key: "*Automated message*",
          value: "*Messaggio automatico*"
        },
        {
          language: "it",
          namespace: "backend",
          key: "Our system only accetps fils up to ",
          value: "Il nostro sistema accetta solo file fino a "
        },
        {
          language: "it",
          namespace: "backend",
          key: "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.",
          value:
            "Abbiamo ricevuto un file oltre il limite di dimensione. Se necessario, può essere ottenuto nell'applicazione WhatsApp."
        },
        {
          language: "it",
          namespace: "backend",
          key: "Back to Main Menu",
          value: "Torna al menu principale"
        },
        {
          language: "it",
          namespace: "backend",
          key: "Service reopened",
          value: "Servizio riaperto"
        },
        {
          language: "it",
          namespace: "backend",
          key: "Rating Cancelled",
          value: "Valutazione annullata"
        },
        {
          language: "it",
          namespace: "backend",
          key: "We are out of office hours right now",
          value: "Siamo fuori dall'orario di lavoro in questo momento"
        },

        {
          language: "es",
          namespace: "backend",
          key: "language",
          value: "Español"
        },
        {
          language: "es",
          namespace: "backend",
          key: "Service completed",
          value: "Servicio completado"
        },
        {
          language: "es",
          namespace: "backend",
          key: "Please rate our service",
          value: "Por favor, califique nuestro servicio"
        },
        {
          language: "es",
          namespace: "backend",
          key: "Send a rating from 1 to 5",
          value: "Envíe una calificación de 1 a 5"
        },
        {
          language: "es",
          namespace: "backend",
          key: "Send *`!`* to return to the service",
          value: "Envíe *`!`* para regresar al servicio"
        },
        {
          language: "es",
          namespace: "backend",
          key: "*Automated message*",
          value: "*Mensaje automatizado*"
        },
        {
          language: "es",
          namespace: "backend",
          key: "Our system only accetps fils up to ",
          value: "Nuestro sistema solo acepta archivos de hasta "
        },
        {
          language: "es",
          namespace: "backend",
          key: "We received a file beyond the size limit, If necessary, it can be obtained in the WhatsApp application.",
          value:
            "Recibimos un archivo que supera el límite de tamaño. Si es necesario, puede obtenerse en la aplicación WhatsApp."
        },
        {
          language: "es",
          namespace: "backend",
          key: "Back to Main Menu",
          value: "Volver al menú principal"
        },
        {
          language: "es",
          namespace: "backend",
          key: "Service reopened",
          value: "Servicio reabierto"
        },
        {
          language: "es",
          namespace: "backend",
          key: "Rating Cancelled",
          value: "Calificación cancelada"
        },
        {
          language: "es",
          namespace: "backend",
          key: "We are out of office hours right now",
          value: "Estamos fuera del horario de atención en este momento"
        }
      ];

      // eslint-disable-next-line no-restricted-syntax
      for (const translation of translations) {
        // eslint-disable-next-line no-await-in-loop
        await queryInterface.bulkInsert("Translations", [translation], {
          transaction
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete("Translations", {}, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
