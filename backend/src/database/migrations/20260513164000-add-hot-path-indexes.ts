import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex("Settings", ["companyId", "key"], {
      name: "idx_settings_companyid_key"
    });

    await queryInterface.addIndex("UserSocketSessions", ["userId", "active"], {
      name: "idx_usersocketsessions_userid_active"
    });

    await queryInterface.addIndex("UserSocketSessions", ["active"], {
      name: "idx_usersocketsessions_active"
    });

    await queryInterface.addIndex("ContactCustomFields", ["contactId"], {
      name: "idx_contactcustomfields_contactid"
    });

    await queryInterface.addIndex("Tickets", ["contactId", "whatsappId"], {
      name: "idx_tickets_contactid_whatsappid"
    });

    await queryInterface.addIndex(
      "Messages",
      ["contactId", "fromMe", "ticketId", "createdAt"],
      {
        name: "idx_messages_contactid_fromme_ticketid_createdat"
      }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "Messages",
      "idx_messages_contactid_fromme_ticketid_createdat"
    );
    await queryInterface.removeIndex(
      "Tickets",
      "idx_tickets_contactid_whatsappid"
    );
    await queryInterface.removeIndex(
      "ContactCustomFields",
      "idx_contactcustomfields_contactid"
    );
    await queryInterface.removeIndex(
      "UserSocketSessions",
      "idx_usersocketsessions_active"
    );
    await queryInterface.removeIndex(
      "UserSocketSessions",
      "idx_usersocketsessions_userid_active"
    );
    await queryInterface.removeIndex("Settings", "idx_settings_companyid_key");
  }
};
