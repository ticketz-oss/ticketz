import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Contacts", "presence", {
      type: DataTypes.STRING,
      defaultValue: "available"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Contacts", "presence");
  }
};
