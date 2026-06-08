import { QueryInterface } from "sequelize";

// ================================================================
//  SEED: Branding Solution Zap
//  Insere as configurações de marca padrão no banco de dados.
//  Executado automaticamente pelo Sequelize ao rodar as seeds.
// ================================================================

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      // Remove entradas antigas de branding se existirem (idempotente)
      await queryInterface.bulkDelete(
        "Settings",
        {
          key: [
            "appName",
            "primaryColorLight",
            "primaryColorDark",
            "appLogoLight",
            "appLogoDark",
            "appLogoFavicon"
          ],
          companyId: 1
        } as any,
        { transaction: t }
      );

      return queryInterface.bulkInsert(
        "Settings",
        [
          {
            key: "appName",
            value: "Solution Zap",
            companyId: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: "primaryColorLight",
            value: "#E65100",
            companyId: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: "primaryColorDark",
            value: "#FF7043",
            companyId: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          // Logos: valor vazio = usa o arquivo SVG local (vector/logo.svg)
          // Quando o admin fizer upload pelo painel, estes valores serão sobrescritos
          {
            key: "appLogoLight",
            value: "",
            companyId: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: "appLogoDark",
            value: "",
            companyId: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: "appLogoFavicon",
            value: "",
            companyId: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        { transaction: t }
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete(
      "Settings",
      {
        key: [
          "appName",
          "primaryColorLight",
          "primaryColorDark",
          "appLogoLight",
          "appLogoDark",
          "appLogoFavicon"
        ],
        companyId: 1
      } as any
    );
  }
};
