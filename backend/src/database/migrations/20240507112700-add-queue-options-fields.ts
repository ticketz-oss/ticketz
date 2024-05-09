import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn("QueueOptions", "forwardQueueId", {
        type: DataTypes.INTEGER,
        references: { model: "Queues", key: "id" },
        allowNull: true,
      });
      await queryInterface.addColumn("QueueOptions", "exitChatbot", {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("QueueOptions", "forwardQueueId");
      await queryInterface.removeColumn("QueueOptions", "exitChatbot");
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
