import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE "Whatsapps"
       SET "extraParameters" = "session"::jsonb
       WHERE "channel" = 'notificamehub'
       AND "session" IS NOT NULL
       AND "session"::jsonb IS NOT NULL`
    );
  },

  down: () => {
    // no-op
  }
};
