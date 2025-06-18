import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Users", "online");
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Users", "online", {
      type: "BOOLEAN",
      allowNull: true
    });
  }
};
