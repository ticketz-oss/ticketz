import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "QueueOptions",
        "forwardQueueId",
        {
          type: DataTypes.INTEGER,
          references: { model: "Queues", key: "id" },
          allowNull: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "QueueOptions",
        "exitChatbot",
        {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("QueueOptions", "forwardQueueId", {
        transaction
      });
      await queryInterface.removeColumn("QueueOptions", "exitChatbot", {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
