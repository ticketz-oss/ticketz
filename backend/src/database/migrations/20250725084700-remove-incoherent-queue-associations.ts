import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "Tickets"
      SET "queueId" = NULL
      WHERE "queueId" IS NOT NULL
        AND "companyId" != (SELECT "companyId" FROM "Queues" WHERE "id" = "Tickets"."queueId");
    `);
  },

  down: async () => {
    // no-op
  }
};
