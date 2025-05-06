import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "Settings"
      SET "value" = 'groq'
      WHERE "key" = 'aiProvider' AND "value" = 'grok';
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "Settings"
      SET "value" = 'grok'
      WHERE "key" = 'aiProvider' AND "value" = 'groq';
    `);
  }
};
