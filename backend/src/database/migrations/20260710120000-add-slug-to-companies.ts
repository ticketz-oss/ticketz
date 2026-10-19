import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Companies", "slug", {
      type: DataTypes.STRING,
      allowNull: true
    });

    // Indice unico simples: o Postgres trata multiplos NULL como distintos,
    // entao empresas existentes (slug NULL) nao violam a unicidade; apenas
    // slugs preenchidos precisam ser unicos.
    await queryInterface.addIndex("Companies", ["slug"], {
      unique: true,
      name: "companies_slug_unique"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("Companies", "companies_slug_unique");
    await queryInterface.removeColumn("Companies", "slug");
  }
};
