import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "Invoices",
        "txId",
        {
          type: DataTypes.STRING
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Invoices",
        "payGw",
        {
          type: DataTypes.STRING
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Invoices",
        "payGwData",
        {
          type: DataTypes.TEXT
        },
        { transaction }
      );
      await queryInterface.addIndex("Invoices", ["txId"], {
        name: "idx_txid",
        unique: false,
        transaction
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
      await queryInterface.removeColumn("Invoices", "txId", { transaction });
      await queryInterface.removeColumn("Invoices", "payGw", { transaction });
      await queryInterface.removeColumn("Invoices", "payGwData", {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
