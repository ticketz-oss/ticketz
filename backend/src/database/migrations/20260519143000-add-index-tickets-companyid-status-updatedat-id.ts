import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex(
      "Tickets",
      ["companyId", "status", "updatedAt", "id"],
      {
        name: "idx_tickets_companyid_status_updatedat_id"
      }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "Tickets",
      "idx_tickets_companyid_status_updatedat_id"
    );
  }
};
