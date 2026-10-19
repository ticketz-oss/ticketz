import { QueryInterface, DataTypes } from "sequelize";

/**
 * O piso de venda deixa de ser uma coluna fixa e passa a ser calculado a
 * partir do preco do plano e do desconto do parceiro, entao "minValue" perde
 * a razao de existir.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Plans", "minValue");
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Plans", "minValue", {
      type: DataTypes.FLOAT,
      allowNull: true
    });

    // Refaz o backfill original para que o rollback devolva o estado anterior.
    await queryInterface.sequelize.query(
      `UPDATE "Plans" SET "minValue" = 197 WHERE "minValue" IS NULL`
    );
  }
};
