import { Op, QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addIndex("CampaignShipping", {
      fields: [
        { name: "number", order: "ASC" },
        { name: "campaignId", order: "ASC" },
        { name: "createdAt", order: "DESC" },
        { name: "id", order: "DESC" }
      ],
      name: "idx_cpsh_confirm_lookup",
      where: {
        confirmationRequestedAt: {
          [Op.ne]: null
        }
      }
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex(
      "CampaignShipping",
      "idx_cpsh_confirm_lookup"
    );
  }
};
