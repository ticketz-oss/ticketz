import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("OAuthClients", {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      clientId: { type: DataTypes.STRING, allowNull: false, unique: true },
      clientName: { type: DataTypes.STRING, allowNull: false },
      redirectUris: { type: DataTypes.JSONB, allowNull: false },
      tokenEndpointAuthMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "none"
      },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("OAuthGrants", {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      oauthClientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "OAuthClients", key: "id" },
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
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      scopes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
      tokenVersion: { type: DataTypes.INTEGER, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
      lastUsedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("OAuthRefreshTokens", {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      grantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "OAuthGrants", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      familyId: { type: DataTypes.UUID, allowNull: false },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      absoluteExpiresAt: { type: DataTypes.DATE, allowNull: false },
      usedAt: { type: DataTypes.DATE, allowNull: true },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("McpAudits", {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      correlationId: { type: DataTypes.UUID, allowNull: true },
      grantId: { type: DataTypes.UUID, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      companyId: { type: DataTypes.INTEGER, allowNull: true },
      event: { type: DataTypes.STRING, allowNull: false },
      tool: { type: DataTypes.STRING, allowNull: true },
      filters: { type: DataTypes.JSONB, allowNull: true },
      recordCount: { type: DataTypes.INTEGER, allowNull: true },
      messageCount: { type: DataTypes.INTEGER, allowNull: true },
      durationMs: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("OAuthRefreshTokens", ["familyId"]);
    await queryInterface.addIndex("OAuthGrants", ["companyId", "active"]);
    await queryInterface.addIndex("McpAudits", ["companyId", "createdAt"]);
    await queryInterface.addIndex(
      "Messages",
      ["companyId", "createdAt", "ticketId"],
      {
        name: "messages_company_created_ticket_mcp_idx"
      }
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex(
      "Messages",
      "messages_company_created_ticket_mcp_idx"
    );
    await queryInterface.dropTable("McpAudits");
    await queryInterface.dropTable("OAuthRefreshTokens");
    await queryInterface.dropTable("OAuthGrants");
    await queryInterface.dropTable("OAuthClients");
  }
};
