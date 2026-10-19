import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Plans", "minValue", {
      type: DataTypes.FLOAT,
      allowNull: true
    });

    // Piso de venda para revenda: nenhum parceiro pode vender abaixo disso.
    await queryInterface.sequelize.query(
      `UPDATE "Plans" SET "minValue" = 197 WHERE "minValue" IS NULL`
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Plans", "minValue");
  }
};
