import { QueryInterface } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addIndex("Messages", ["ticketId", "quotedMsgId"], {
      name: "idx_messages_ticketid_quotedmsgid"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeIndex(
      "Messages",
      "idx_messages_ticketid_quotedmsgid"
    );
  }
};
