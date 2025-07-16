import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Queues", "visibleToIntegrations", {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn("Queues", "description", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Queues", "visibleToIntegrations");
    await queryInterface.removeColumn("Queues", "description");
  }
};
