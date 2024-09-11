import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn("Invoices", "txId", {
        type: DataTypes.STRING,
        
      });        
      await queryInterface.addColumn("Invoices", "payGw", {
        type: DataTypes.STRING,
      });
      await queryInterface.addColumn("Invoices", "payGwData", {
        type: DataTypes.TEXT,
      });
      await queryInterface.addIndex("Invoices", [ "txId" ], {
        name: "idx_txid",
        unique: false,
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
      await queryInterface.removeColumn("Invoices", "txId");
      await queryInterface.removeColumn("Invoices", "payGw");        
      await queryInterface.removeColumn("Invoices", "payGwData");
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
