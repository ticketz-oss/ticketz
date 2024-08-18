import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Whatsapps", "restrictToQueues", {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }),
      queryInterface.addColumn("Whatsapps", "transferToNewTicket", {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Whatsapps", "restrictToQueues"),
      queryInterface.removeColumn("Whatsapps", "transferToNewTicket")
    ]);
  }
};
