import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
        queryInterface.addColumn("Contacts", "disableBot", {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }),
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    Promise.all([
        queryInterface.removeColumn("Contacts", "disableBot"),
    ]);
  }
};
