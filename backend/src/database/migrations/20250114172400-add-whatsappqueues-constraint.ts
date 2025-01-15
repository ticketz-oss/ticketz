import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      // Remove invalid references
      await queryInterface.sequelize.query(
        `
          DELETE FROM "WhatsappQueues"
          WHERE "whatsappId" NOT IN (SELECT "id" FROM "Whatsapps")
          OR "queueId" NOT IN (SELECT "id" FROM "Users")
        `,
        { transaction }
      );

      // Add constraints
      await queryInterface.addConstraint("WhatsappQueues", {
        fields: ["whatsappId"],
        type: "foreign key",
        name: "fk_whatsappqueues_whatsappid",
        references: {
          table: "Whatsapps",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });

      await queryInterface.addConstraint("WhatsappQueues", {
        fields: ["queueId"],
        type: "foreign key",
        name: "fk_whatsappqueues_queueid",
        references: {
          table: "Users",
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
      queryInterface.removeConstraint(
        "WhatsappQueues",
        "fk_whatsappqueues_whatsappid"
      ),
      queryInterface.removeConstraint(
        "WhatsappQueues",
        "fk_whatsappqueues_queueid"
      )
    ]);
  }
};
