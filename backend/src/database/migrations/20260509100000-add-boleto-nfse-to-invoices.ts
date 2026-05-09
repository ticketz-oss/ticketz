import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "Invoices",
        "paymentMethod",
        { type: DataTypes.STRING, defaultValue: "pix" },
        { transaction }
      );
      await queryInterface.addColumn(
        "Invoices",
        "boletoUrl",
        { type: DataTypes.TEXT },
        { transaction }
      );
      await queryInterface.addColumn(
        "Invoices",
        "boletoBarcode",
        { type: DataTypes.TEXT },
        { transaction }
      );
      await queryInterface.addColumn(
        "Invoices",
        "nfseId",
        { type: DataTypes.STRING },
        { transaction }
      );
      await queryInterface.addColumn(
        "Invoices",
        "nfseUrl",
        { type: DataTypes.TEXT },
        { transaction }
      );
      await queryInterface.addColumn(
        "Invoices",
        "nfseStatus",
        { type: DataTypes.STRING },
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
      for (const col of [
        "paymentMethod",
        "boletoUrl",
        "boletoBarcode",
        "nfseId",
        "nfseUrl",
        "nfseStatus"
      ]) {
        await queryInterface.removeColumn("Invoices", col, { transaction });
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
