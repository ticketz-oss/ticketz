import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // "company" (padrao, tutoriais do tenant) ou "partner" (tutoriais de revenda).
    await queryInterface.addColumn("Helps", "audience", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "company"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Helps", "audience");
  }
};
