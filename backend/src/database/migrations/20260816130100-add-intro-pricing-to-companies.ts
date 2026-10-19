import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Preco cobrado durante o periodo inicial da venda. Pode ser maior ou
    // menor que a mensalidade: serve tanto para embutir implantacao quanto
    // para desconto de captacao.
    await queryInterface.addColumn("Companies", "introValue", {
      type: DataTypes.FLOAT,
      allowNull: true
    });

    // Quantos meses o periodo inicial dura. Depois disso a cobranca passa
    // sozinha para o saleValue.
    await queryInterface.addColumn("Companies", "introMonths", {
      type: DataTypes.INTEGER,
      allowNull: true
    });

    // Snapshot do que a plataforma recebe por ciclo, travado no momento da
    // venda: reajuste de plano so vale para clientes novos.
    await queryInterface.addColumn("Companies", "platformCost", {
      type: DataTypes.FLOAT,
      allowNull: true
    });

    await queryInterface.sequelize.query(
      `UPDATE "Companies" c SET "platformCost" = ROUND((p."value" * 0.7)::numeric, 2)
       FROM "Plans" p WHERE p.id = c."planId" AND c."partnerId" IS NOT NULL`
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Companies", "platformCost");
    await queryInterface.removeColumn("Companies", "introMonths");
    await queryInterface.removeColumn("Companies", "introValue");
  }
};
