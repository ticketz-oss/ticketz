import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "Settings"
      SET "value" = 'Espaço Whats', "updatedAt" = NOW()
      WHERE "key" = 'appName'
        AND LOWER(BTRIM("value")) IN (
          'ticketz',
          'ticketz - chat based ticket system'
        );
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "Settings"
      SET "value" = 'Ticketz', "updatedAt" = NOW()
      WHERE "key" = 'appName' AND "value" = 'Espaço Whats';
    `);
  }
};
