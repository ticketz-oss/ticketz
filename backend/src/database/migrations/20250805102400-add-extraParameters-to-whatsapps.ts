import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Whatsapps", "extraParameters", {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Whatsapps", "extraParameters");
  }
};
