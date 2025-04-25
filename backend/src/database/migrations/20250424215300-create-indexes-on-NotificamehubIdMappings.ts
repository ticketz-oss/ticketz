import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addIndex("NotificamehubIdMappings", ["messageId"], {
        name: "NotificamehubIdMappings_messageId_index"
      }),
      queryInterface.addIndex("NotificamehubIdMappings", ["ticketId"], {
        name: "NotificamehubIdMappings_ticketId_index"
      })
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeIndex(
        "NotificamehubIdMappings",
        "NotificamehubIdMappings_messageId_index"
      ),
      queryInterface.removeIndex(
        "NotificamehubIdMappings",
        "NotificamehubIdMappings_ticketId_index"
      )
    ]);
  }
};
