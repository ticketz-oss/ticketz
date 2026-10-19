import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Companies", "partnerId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Partners", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    // Preco negociado pelo parceiro. Quando nulo, a fatura nasce com o
    // valor do plano (comportamento atual).
    await queryInterface.addColumn("Companies", "saleValue", {
      type: DataTypes.FLOAT,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Companies", "saleValue");
    await queryInterface.removeColumn("Companies", "partnerId");
  }
};
