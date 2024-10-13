import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.changeColumn("Whatsapps", "channel", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "whatsapp"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.changeColumn("Whatsapps", "channel", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    });
  }
};
