import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Ordem em que as filas aparecem no menu inicial do chatbot. Antes o menu
    // seguia a ordem alfabetica devolvida pelo ShowWhatsAppService.
    await queryInterface.addColumn("Queues", "order", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Backfill mantendo exatamente a ordem alfabetica vigente por empresa.
    await queryInterface.sequelize.query(`
      UPDATE "Queues" q
      SET "order" = s.rn - 1
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY "companyId"
            ORDER BY name ASC, id ASC
          ) AS rn
        FROM "Queues"
      ) s
      WHERE q.id = s.id;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Queues", "order");
  }
};
