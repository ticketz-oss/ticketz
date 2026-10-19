import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Posicao do item entre os irmaos (0..N-1). Passa a ser a fonte da verdade
    // da ordem, que antes era inferida do campo "option" comparado como texto.
    await queryInterface.addColumn("QueueOptions", "order", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Liga/desliga o envio da opcao sem precisar apagar a ramificacao.
    await queryInterface.addColumn("QueueOptions", "isActive", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Backfill preservando a ordem numerica atual. Opcoes com "option" nao
    // numerico (ou vazio) vao para o fim do grupo, desempatadas por id.
    await queryInterface.sequelize.query(`
      UPDATE "QueueOptions" q
      SET "order" = s.rn - 1
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE("queueId", -1), COALESCE("parentId", -1)
            ORDER BY
              NULLIF(regexp_replace(COALESCE("option", ''), '\\D', '', 'g'), '')::int
                NULLS LAST,
              id
          ) AS rn
        FROM "QueueOptions"
      ) s
      WHERE q.id = s.id;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("QueueOptions", "isActive");
    await queryInterface.removeColumn("QueueOptions", "order");
  }
};
