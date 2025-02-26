import { QueryInterface } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.removeConstraint(
      "QueueOptions",
      "QueueOptions_forwardQueueId_fkey"
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.addConstraint("QueueOptions", {
      fields: ["forwardQueueId"],
      type: "foreign key",
      name: "QueueOptions_forwardQueueId_fkey",
      references: {
        table: "Queues",
        field: "id"
      },
      onUpdate: "NO ACTION",
      onDelete: "NO ACTION"
    });
  }
};
