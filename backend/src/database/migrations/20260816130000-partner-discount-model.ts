import { QueryInterface, DataTypes } from "sequelize";

/**
 * Troca o modelo comercial do canal: o parceiro deixa de ganhar um percentual
 * sobre a venda e passa a comprar o plano com desconto, ficando com tudo o que
 * cobrar acima desse custo.
 *
 * `commissionPct` (comissao) e `discountPct` (desconto de revenda) sao numeros
 * com significados diferentes, entao o valor antigo NAO e carregado: todo mundo
 * nasce no padrao de 30%.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.renameColumn("Partners", "commissionPct", "discountPct");

    await queryInterface.changeColumn("Partners", "discountPct", {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 30
    });

    await queryInterface.sequelize.query(
      `UPDATE "Partners" SET "discountPct" = 30`
    );

    await queryInterface.renameColumn(
      "PartnerPayouts",
      "commissionPct",
      "platformCost"
    );

    // Mantem o razao coerente com a formula nova (amount = base - custo):
    // o custo implicito de cada repasse antigo e exatamente essa diferenca.
    await queryInterface.sequelize.query(
      `UPDATE "PartnerPayouts" SET "platformCost" = "baseValue" - "amount"`
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE "PartnerPayouts" SET "platformCost" = CASE
         WHEN "baseValue" > 0 THEN ROUND((("amount" / "baseValue") * 100)::numeric, 2)
         ELSE 0
       END`
    );

    await queryInterface.renameColumn(
      "PartnerPayouts",
      "platformCost",
      "commissionPct"
    );

    await queryInterface.renameColumn("Partners", "discountPct", "commissionPct");

    await queryInterface.changeColumn("Partners", "commissionPct", {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
  }
};
