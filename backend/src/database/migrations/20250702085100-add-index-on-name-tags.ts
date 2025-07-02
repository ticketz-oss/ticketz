import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS unaccent;

      CREATE INDEX tags_name_unaccent_lower_index
      ON "Tags" (immutable_unaccent(LOWER("name")));
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX tags_name_unaccent_lower_index;
    `);
  }
};
