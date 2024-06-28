import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Contacts", "presence", {
        type: DataTypes.STRING,
        defaultValue: "available"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    Promise.all([queryInterface.removeColumn("Contacts", "presence")]);
  }
};
