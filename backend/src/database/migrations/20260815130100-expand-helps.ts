import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Nullable primeiro: so depois do backfill vira NOT NULL.
    await queryInterface.addColumn("Helps", "groupId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "HelpGroups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    });

    // "video" (padrao, o unico formato que existia) ou "article".
    await queryInterface.addColumn("Helps", "type", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "video"
    });

    // HTML do editor Quill, ja sanitizado no controller.
    await queryInterface.addColumn("Helps", "content", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Helps", "duration", {
      type: DataTypes.STRING,
      allowNull: true
    });

    // Posicao entre os conteudos do mesmo grupo (0..N-1).
    await queryInterface.addColumn("Helps", "order", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn("Helps", "isActive", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Um grupo "Geral" por publico ja presente, para nao perder tutorial algum.
    await queryInterface.sequelize.query(`
      INSERT INTO "HelpGroups"
        (title, subtitle, icon, audience, "order", "isActive", "createdAt", "updatedAt")
      SELECT
        'Geral',
        NULL,
        'HelpOutline',
        h.audience,
        0,
        true,
        NOW(),
        NOW()
      FROM (SELECT DISTINCT audience FROM "Helps") h;
    `);

    await queryInterface.sequelize.query(`
      UPDATE "Helps" h
      SET "groupId" = g.id
      FROM "HelpGroups" g
      WHERE g.title = 'Geral'
        AND g.audience = h.audience;
    `);

    // Ordem densa dentro de cada grupo, preservando a ordem alfabetica vigente.
    await queryInterface.sequelize.query(`
      UPDATE "Helps" h
      SET "order" = s.rn - 1
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY "groupId"
            ORDER BY title ASC, id ASC
          ) AS rn
        FROM "Helps"
      ) s
      WHERE h.id = s.id;
    `);

    // SQL cru em vez de changeColumn: o gerador do Postgres reemitiria o
    // REFERENCES e deixaria uma segunda chave estrangeira anonima na tabela.
    await queryInterface.sequelize.query(`
      ALTER TABLE "Helps" ALTER COLUMN "groupId" SET NOT NULL;
    `);

    // Fonte unica do publico passa a ser HelpGroups.audience.
    await queryInterface.removeColumn("Helps", "audience");
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Helps", "audience", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE "Helps" h
      SET audience = g.audience
      FROM "HelpGroups" g
      WHERE g.id = h."groupId";
    `);

    await queryInterface.sequelize.query(`
      UPDATE "Helps" SET audience = 'company' WHERE audience IS NULL;
    `);

    await queryInterface.changeColumn("Helps", "audience", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "company"
    });

    await queryInterface.removeColumn("Helps", "isActive");
    await queryInterface.removeColumn("Helps", "order");
    await queryInterface.removeColumn("Helps", "duration");
    await queryInterface.removeColumn("Helps", "content");
    await queryInterface.removeColumn("Helps", "type");
    // A tabela HelpGroups e derrubada pelo down da migration anterior, que roda
    // logo em seguida — por isso o groupId sai por ultimo aqui.
    await queryInterface.removeColumn("Helps", "groupId");
  }
};
