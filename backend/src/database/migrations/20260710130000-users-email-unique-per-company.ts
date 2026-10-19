import { QueryInterface } from "sequelize";

// Multi-tenant: o mesmo email pode existir em empresas diferentes (ex.: o
// super admin da plataforma replicado em cada empresa). Troca a unicidade
// GLOBAL de email por unicidade composta (companyId, email).
//
// Obs.: o "down" recria a unicidade global de email e so' funciona se nao
// houver emails duplicados entre empresas.
const GLOBAL_UNIQUE = "Users_email_key";
const COMPOSITE_UNIQUE = "Users_companyId_email_unique";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface
      .removeConstraint("Users", GLOBAL_UNIQUE)
      .catch(() => undefined);

    await queryInterface.addConstraint("Users", {
      fields: ["companyId", "email"],
      type: "unique",
      name: COMPOSITE_UNIQUE
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface
      .removeConstraint("Users", COMPOSITE_UNIQUE)
      .catch(() => undefined);

    await queryInterface.addConstraint("Users", {
      fields: ["email"],
      type: "unique",
      name: GLOBAL_UNIQUE
    });
  }
};
