import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Whatsapps", "apiMode", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "baileys"
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE "Whatsapps"
      ADD CONSTRAINT "whatsapps_api_mode_check"
      CHECK ("apiMode" IN ('baileys', 'official'));
    `);

    await queryInterface.addColumn("Whatsapps", "metaWabaId", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaPhoneNumberId", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaBusinessId", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaAccessToken", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaTokenExpiresAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaHealthStatus", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaHealthCheckedAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaWebhookVerifiedAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Whatsapps", "metaWebhookVerifiedAt");
    await queryInterface.removeColumn("Whatsapps", "metaHealthCheckedAt");
    await queryInterface.removeColumn("Whatsapps", "metaHealthStatus");
    await queryInterface.removeColumn("Whatsapps", "metaTokenExpiresAt");
    await queryInterface.removeColumn("Whatsapps", "metaAccessToken");
    await queryInterface.removeColumn("Whatsapps", "metaBusinessId");
    await queryInterface.removeColumn("Whatsapps", "metaPhoneNumberId");
    await queryInterface.removeColumn("Whatsapps", "metaWabaId");
    await queryInterface.removeConstraint(
      "Whatsapps",
      "whatsapps_api_mode_check"
    );
    await queryInterface.removeColumn("Whatsapps", "apiMode");
  }
};
