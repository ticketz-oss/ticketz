import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Nullable primeiro: so depois do backfill vira NOT NULL.
    await queryInterface.addColumn("HelpGroups", "companyId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Companies", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    });

    // true = material da plataforma, visivel para todas as empresas.
    await queryInterface.addColumn("HelpGroups", "isGlobal", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Ate aqui todo card era do super admin e aparecia para todo mundo, porque
    // a leitura nunca filtrou por empresa. Preserva esse comportamento nas
    // linhas existentes para ninguem perder tutorial quando o escopo entrar.
    await queryInterface.sequelize.query(`
      UPDATE "HelpGroups" SET
        "isGlobal" = true,
        "companyId" = COALESCE(
          (SELECT "companyId" FROM "Users" WHERE "super" = true ORDER BY id ASC LIMIT 1),
          (SELECT MIN(id) FROM "Companies")
        );
    `);

    // SQL cru em vez de changeColumn: o gerador do Postgres reemitiria o
    // REFERENCES e deixaria uma segunda chave estrangeira anonima na tabela.
    await queryInterface.sequelize.query(`
      ALTER TABLE "HelpGroups" ALTER COLUMN "companyId" SET NOT NULL;
    `);

    await queryInterface.addIndex("HelpGroups", [
      "audience",
      "isGlobal",
      "companyId"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("HelpGroups", [
      "audience",
      "isGlobal",
      "companyId"
    ]);
    await queryInterface.removeColumn("HelpGroups", "isGlobal");
    await queryInterface.removeColumn("HelpGroups", "companyId");
  }
};
