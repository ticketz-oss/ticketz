import { QueryInterface } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addIndex("TicketTraking", ["ticketId"], {
      name: "idx_tickettraking_ticketid"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeIndex(
      "TicketTraking",
      "idx_tickettraking_ticketid"
    );
  }
};
