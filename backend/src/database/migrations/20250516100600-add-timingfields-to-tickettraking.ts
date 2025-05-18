import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    // Add waitTime generated column
    await queryInterface.sequelize.query(`
      ALTER TABLE "TicketTraking"
      ADD COLUMN "waitTime" INTEGER GENERATED ALWAYS AS (
        CASE
          WHEN "chatbotendAt" IS NOT NULL AND "startedAt" IS NOT NULL THEN EXTRACT(EPOCH FROM ("startedAt" - "chatbotendAt"))
          WHEN "queuedAt" IS NOT NULL AND "startedAt" IS NOT NULL THEN EXTRACT(EPOCH FROM ("startedAt" - "queuedAt"))
          WHEN "createdAt" IS NOT NULL AND "startedAt" IS NOT NULL THEN EXTRACT(EPOCH FROM ("startedAt" - "createdAt"))
          ELSE NULL
        END
      ) STORED;
    `);

    // Add serviceTime generated column
    await queryInterface.sequelize.query(`
      ALTER TABLE "TicketTraking"
      ADD COLUMN "serviceTime" INTEGER GENERATED ALWAYS AS (
        CASE
          WHEN "startedAt" IS NOT NULL AND "finishedAt" IS NOT NULL THEN EXTRACT(EPOCH FROM ("finishedAt" - "startedAt"))
          ELSE NULL
        END
      ) STORED;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // Remove waitTime generated column
    await queryInterface.sequelize.query(`
      ALTER TABLE "TicketTraking"
      DROP COLUMN "waitTime";
    `);

    // Remove serviceTime generated column
    await queryInterface.sequelize.query(`
      ALTER TABLE "TicketTraking"
      DROP COLUMN "serviceTime";
    `);
  }
};
