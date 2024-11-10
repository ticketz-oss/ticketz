import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Contacts", "disableBot", {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Contacts", "disableBot");
  }
};
