import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Companies", "timezone", {
      type: DataTypes.STRING(100),
      allowNull: true
    });

    // Preserve the tenant default already chosen in the newer opening-hours
    // format. Legacy schedule arrays remain untouched and will be initialized
    // from the first authenticated browser.
    await queryInterface.sequelize.query(`
      UPDATE "Companies"
      SET "timezone" = schedules->>'timezone'
      WHERE jsonb_typeof(schedules) = 'object'
        AND NULLIF(schedules->>'timezone', '') IS NOT NULL
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Companies", "timezone");
  }
};
