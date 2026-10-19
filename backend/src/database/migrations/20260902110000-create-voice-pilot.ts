import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("VoiceConnections", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Whatsapps", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      sessionId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true
      },
      state: {
        type: DataTypes.STRING(24),
        allowNull: false,
        defaultValue: "disconnected"
      },
      paired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
    await queryInterface.addIndex(
      "VoiceConnections",
      ["companyId", "whatsappId"],
      {
        unique: true,
        name: "voice_connections_company_whatsapp_unique"
      }
    );

    await queryInterface.createTable("VoiceCalls", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      externalCallId: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      voiceConnectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "VoiceConnections", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Whatsapps", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      queueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      queueIds: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      number: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      direction: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "inbound"
      },
      state: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "ringing"
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      durationSeconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
    await queryInterface.addIndex(
      "VoiceCalls",
      ["companyId", "state", "startedAt"],
      {
        name: "voice_calls_company_state_started_idx"
      }
    );

    await queryInterface.sequelize.query(`
      INSERT INTO "Settings" ("key", "value", "companyId", "createdAt", "updatedAt")
      SELECT 'voiceCallsEnabled', 'true', c.id, NOW(), NOW()
      FROM "Companies" c
      WHERE c.slug = 'teste'
        AND NOT EXISTS (
          SELECT 1 FROM "Settings" s
          WHERE s."companyId" = c.id AND s."key" = 'voiceCallsEnabled'
        )
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `DELETE FROM "Settings" WHERE "key" = 'voiceCallsEnabled'`
    );
    await queryInterface.dropTable("VoiceCalls");
    await queryInterface.dropTable("VoiceConnections");
  }
};
