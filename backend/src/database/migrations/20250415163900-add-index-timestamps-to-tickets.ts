import { QueryInterface } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addIndex("Tickets", ["createdAt"], {
        name: "idx_tickets_createdat"
      }),
      queryInterface.addIndex("Tickets", ["updatedAt"], {
        name: "idx_tickets_updatedat"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeIndex("Tickets", "idx_tickets_createdat"),
      queryInterface.removeIndex("Tickets", "idx_tickets_updatedat")
    ]);
  }
};
