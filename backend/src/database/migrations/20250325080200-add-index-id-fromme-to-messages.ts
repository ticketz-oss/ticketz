import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.addIndex("Messages", ["id", "fromMe"], {
      name: "idx_messages_id_fromme"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.removeIndex("Messages", "idx_messages_id_fromme");
  }
};
