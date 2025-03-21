import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex("Messages", ["companyId", "contactId"], {
      name: "idx_messages_companyid_contactid"
    });

    await queryInterface.addIndex("Messages", ["ticketId", "companyId"], {
      name: "idx_messages_ticketid_companyid"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "Messages",
      "idx_messages_companyid_contactid"
    );
    await queryInterface.removeIndex(
      "Messages",
      "idx_messages_ticketid_companyid"
    );
  }
};
