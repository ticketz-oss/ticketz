import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn("QueueOptions", "forwardQueueId", {
      type: DataTypes.INTEGER,
      references: { model: "Queues", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn("QueueOptions", "forwardQueueId", {
      type: DataTypes.INTEGER,
      references: { model: "Queues", key: "id" },
      allowNull: true
    });
  }
};
