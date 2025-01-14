import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      // Remove invalid references
      await queryInterface.sequelize.query(
        `
          DELETE FROM "UserQueues"
          WHERE "userId" NOT IN (SELECT "id" FROM "Users")
          OR "queueId" NOT IN (SELECT "id" FROM "Queues")
        `,
        { transaction }
      );

      // Add constraints
      await queryInterface.addConstraint("UserQueues", {
        fields: ["userId"],
        type: "foreign key",
        name: "fk_userqueues_userid",
        references: {
          table: "Users",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });

      await queryInterface.addConstraint("UserQueues", {
        fields: ["queueId"],
        type: "foreign key",
        name: "fk_userqueues_queueid",
        references: {
          table: "Queues",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });
    });
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeConstraint("UserQueues", "fk_userqueues_userid"),
      queryInterface.removeConstraint("UserQueues", "fk_userqueues_queueid")
    ]);
  }
};
