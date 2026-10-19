import { QueryInterface, DataTypes, Transaction } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction: Transaction =
      await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        "Contacts",
        "language",
        {
          type: DataTypes.STRING,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Whatsapps",
        "language",
        {
          type: DataTypes.STRING,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Companies",
        "language",
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
      await queryInterface.removeColumn("Contacts", "language", {
        transaction
      });
      await queryInterface.removeColumn("Whatsapps", "language", {
        transaction
      });
      await queryInterface.removeColumn("Companies", "language", {
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
