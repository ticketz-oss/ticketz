import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("ProspeccaoAutomacoes", "enabledAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      'UPDATE "ProspeccaoAutomacoes" SET "enabledAt" = "updatedAt" WHERE enabled = true'
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("ProspeccaoAutomacoes", "enabledAt");
  }
};
