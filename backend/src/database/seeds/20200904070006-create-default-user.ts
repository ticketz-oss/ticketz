import { QueryInterface } from "sequelize";
import { hash } from "bcryptjs";

// ================================================================
//  SEED: Usuário admin padrão - Solution Zap
//  Email e senha definidos via variável de ambiente no .env
// ================================================================

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const adminPassword = process.env.ADMIN_PASSWORD || "SolutionZap@2025";
      const adminEmail = process.env.EMAIL_ADDRESS || "admin@solutionzap.com.br";
      const passwordHash = await hash(adminPassword, 8);

      return Promise.all([
        queryInterface.bulkInsert(
          "Users",
          [
            {
              name: "Admin Solution Zap",
              email: adminEmail,
              profile: "admin",
              passwordHash,
              companyId: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              super: true
            }
          ],
          { transaction: t }
        )
      ]);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Users", {});
  }
};
