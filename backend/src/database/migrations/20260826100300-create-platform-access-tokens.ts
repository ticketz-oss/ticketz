import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("PlatformAccessTokens", {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      kind: { type: DataTypes.STRING, allowNull: false, defaultValue: "sso" },
      motivo: { type: DataTypes.STRING, allowNull: true },
      ator: { type: DataTypes.STRING, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      usedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex(
      "PlatformAccessTokens",
      ["companyId", "createdAt"],
      { name: "platform_access_tokens_audit_idx" }
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("PlatformAccessTokens");
  }
};
