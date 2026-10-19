import { QueryInterface } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addIndex("TicketTraking", ["createdAt"], {
        name: "idx_tickettraking_createdat"
      }),
      queryInterface.addIndex("TicketTraking", ["updatedAt"], {
        name: "idx_tickettraking_updatedat"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeIndex(
        "TicketTraking",
        "idx_tickettraking_createdat"
      ),
      queryInterface.removeIndex("TicketTraking", "idx_tickettraking_updatedat")
    ]);
  }
};
