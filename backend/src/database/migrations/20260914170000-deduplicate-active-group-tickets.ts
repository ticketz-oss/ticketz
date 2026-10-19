import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `
          WITH ranked AS (
            SELECT
              id,
              ROW_NUMBER() OVER (
                PARTITION BY "companyId", "contactId"
                ORDER BY "updatedAt" DESC, id DESC
              ) AS position
            FROM "Tickets"
            WHERE "isGroup" = true
              AND status IN ('open', 'pending')
          )
          UPDATE "Tickets" AS ticket
          SET status = 'closed'
          FROM ranked
          WHERE ticket.id = ranked.id
            AND ranked.position > 1;
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          CREATE UNIQUE INDEX "tickets_one_active_group_per_company_contact"
          ON "Tickets" ("companyId", "contactId")
          WHERE "isGroup" = true
            AND status IN ('open', 'pending');
        `,
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "tickets_one_active_group_per_company_contact";'
    );
  }
};
