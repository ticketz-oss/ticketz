import { DataTypes, QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn("NotificamehubIdMappings", "messageId", {
      type: DataTypes.TEXT,
      allowNull: false
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn("NotificamehubIdMappings", "messageId", {
      type: DataTypes.STRING,
      allowNull: false
    });
  }
};
