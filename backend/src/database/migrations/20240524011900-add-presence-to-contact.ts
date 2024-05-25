import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Contacts", "presence", {
        type: DataTypes.STRING,
<<<<<<< HEAD
        defaultValue: "available"
=======
        defaultValue: false
>>>>>>> 0ee9f17 (COLOCAR PRESENÇA DO CONTATO NA LISTA DE CONVERSAS)
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    Promise.all([queryInterface.removeColumn("Contacts", "presence")]);
  }
};
