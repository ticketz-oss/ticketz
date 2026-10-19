import { DataTypes, QueryInterface } from "sequelize";

// Choices made by the customer in the public self-service checkout: which
// WhatsApp integration they want (Meta official API or QR code session) and,
// on plans where AI is billed separately, which AI package they picked.
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Existing installations already have whatsappMode with a legacy default.
    // Preserve that column and allow a partially applied migration to resume.
    const columns = await queryInterface.describeTable("Companies");
    if (!columns.whatsappMode) {
      // Same shape as the legacy column: "normal" (QR code) or "meta".
      await queryInterface.addColumn("Companies", "whatsappMode", {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "normal"
      });
      await queryInterface.addConstraint("Companies", {
        fields: ["whatsappMode"],
        type: "check",
        name: "companies_whatsapp_mode_check",
        where: { whatsappMode: ["normal", "meta"] }
      });
    }
    if (!columns.aiAddon) {
      await queryInterface.addColumn("Companies", "aiAddon", {
        type: DataTypes.STRING(32),
        allowNull: true
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // whatsappMode is kept: on existing installations it predates this
    // migration and holds data this migration did not create.
    await queryInterface.removeColumn("Companies", "aiAddon");
  }
};
