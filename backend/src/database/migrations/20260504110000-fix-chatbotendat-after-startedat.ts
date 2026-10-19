import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    // Clear chatbotendAt values that are after startedAt. Those were stamped
    // when the chatbot was deactivated at ticket close or after a transfer back
    // to a chatbot queue — NOT during the initial pre-acceptance hand-off.
    // The correct semantic is: chatbotendAt marks the end of the first chatbot
    // session, which must happen before the first human acceptance (startedAt).
    await queryInterface.sequelize.query(`
      UPDATE "TicketTraking"
      SET "chatbotendAt" = NULL
      WHERE "chatbotendAt" IS NOT NULL
        AND "startedAt" IS NOT NULL
        AND "chatbotendAt" > "startedAt";
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // There is no safe way to restore the cleared values; this migration is
    // irreversible because the original timestamps were semantically incorrect.
  }
};
