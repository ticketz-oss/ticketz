import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("PlatformWebhookOutboxes", {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
      },
      evento: { type: DataTypes.STRING, allowNull: false },
      tenantId: { type: DataTypes.INTEGER, allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending"
      },
      attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      nextAttemptAt: { type: DataTypes.DATE, allowNull: true },
      lastError: { type: DataTypes.TEXT, allowNull: true },
      sentAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex(
      "PlatformWebhookOutboxes",
      ["status", "nextAttemptAt"],
      { name: "platform_webhook_outbox_pending_idx" }
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("PlatformWebhookOutboxes");
  }
};
