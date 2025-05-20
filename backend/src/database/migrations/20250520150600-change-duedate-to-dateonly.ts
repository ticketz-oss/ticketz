import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    // Change the column to DATE using a raw SQL query to preserve UTC date
    await queryInterface.sequelize.query(`
        ALTER TABLE "Companies"
        ALTER COLUMN "dueDate"
        TYPE DATE
        USING ("dueDate" AT TIME ZONE 'UTC')::DATE;
      `);
  },
  down: async (queryInterface: QueryInterface) => {
    // Revert the column to TIMESTAMP using a raw SQL query
    await queryInterface.sequelize.query(`
        ALTER TABLE "Companies"
        ALTER COLUMN "dueDate"
        TYPE TIMESTAMP WITH TIME ZONE
        USING "dueDate"::timestamp with time zone;
      `);
  }
};
