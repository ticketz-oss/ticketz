import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "TicketTraking"
        SET "finishedAt" = "ratingAt"
        WHERE "ratingAt" IS NOT NULL;
    `);
  },

  down: async () => {
    // no operation
  }
};
