import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      // Remove invalid constraints
      try {
        await queryInterface.removeConstraint(
          "WhatsappQueues",
          "fk_whatsappqueues_queueid"
        );
      } catch (error) {
        // ignore error
      }

      // Remove invalid references
      await queryInterface.sequelize.query(
        `
          DELETE FROM "WhatsappQueues"
          WHERE "queueId" NOT IN (SELECT "id" FROM "Queues")
        `,
        { transaction }
      );

      await queryInterface.addConstraint("WhatsappQueues", {
        fields: ["queueId"],
        type: "foreign key",
        name: "fk_whatsappqueues_queueid",
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
    return queryInterface.removeConstraint(
      "WhatsappQueues",
      "fk_whatsappqueues_queueid"
    );
  }
};
