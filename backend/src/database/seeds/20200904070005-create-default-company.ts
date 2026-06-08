import { QueryInterface } from "sequelize";

// ================================================================
//  SEED: Empresa e Plano padrão - Solution Zap
// ================================================================

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.bulkInsert(
          "Plans",
          [
            {
              name: "Starter",
              users: 3,
              connections: 1,
              queues: 3,
              value: 97,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              name: "Professional",
              users: 10,
              connections: 3,
              queues: 10,
              value: 197,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              name: "Enterprise",
              users: 9999,
              connections: 10,
              queues: 9999,
              value: 397,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          { transaction: t }
        ),
        queryInterface.bulkInsert(
          "Companies",
          [
            {
              name: "Solution Zap",
              planId: 2,
              dueDate: "2093-03-14 04:00:00+01",
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          { transaction: t }
        )
      ]);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.bulkDelete("Companies", {}),
      queryInterface.bulkDelete("Plans", {})
    ]);
  }
};
