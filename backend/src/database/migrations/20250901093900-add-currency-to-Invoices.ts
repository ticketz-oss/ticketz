import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Invoices", "currency", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Invoices", "currency");
  }
};
