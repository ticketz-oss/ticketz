import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Plans", "campaignsEnabled", {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Plans", "campaignsEnabled");
  }
};
