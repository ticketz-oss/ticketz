import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Companies", "whatsappMode", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "normal"
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "Companies"
      ADD CONSTRAINT "companies_whatsapp_mode_check"
      CHECK ("whatsappMode" IN ('normal', 'meta'));
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint(
      "Companies",
      "companies_whatsapp_mode_check"
    );
    await queryInterface.removeColumn("Companies", "whatsappMode");
  }
};
