import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Plans", "currency", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Plans", "currency");
  }
};
