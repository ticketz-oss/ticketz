import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex("Messages", ["id", "companyId"], {
      name: "idx_messages_id_companyid"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("Messages", "idx_messages_id_companyid");
  }
};
