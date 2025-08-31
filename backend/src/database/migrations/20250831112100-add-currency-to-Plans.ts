import { QueryInterface, DataTypes, Transaction } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction: Transaction =
      await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        "Plans",
        "currency",
        {
          type: DataTypes.STRING,
          allowNull: true
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction: Transaction =
      await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn("Plans", "currency", {
        transaction
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
