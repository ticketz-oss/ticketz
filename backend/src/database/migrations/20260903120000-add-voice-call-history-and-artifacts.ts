import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("VoiceCalls", "contactId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Contacts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addColumn("VoiceCalls", "ticketId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Tickets", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addColumn("VoiceCalls", "recordingEnabled", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("VoiceCalls", "transcriptionEnabled", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("VoiceCalls", "artifactStatus", {
      type: DataTypes.STRING(24),
      allowNull: true
    });
    await queryInterface.addColumn("VoiceCalls", "recordingUrl", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("VoiceCalls", "transcript", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("VoiceCalls", "transcriptSegments", {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await queryInterface.addColumn("VoiceCalls", "transcriptionProvider", {
      type: DataTypes.STRING(24),
      allowNull: true
    });
    await queryInterface.addColumn("VoiceCalls", "transcriptionModel", {
      type: DataTypes.STRING(64),
      allowNull: true
    });
    await queryInterface.addColumn("VoiceCalls", "artifactError", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addIndex("VoiceCalls", ["contactId", "startedAt"], {
      name: "voice_calls_contact_started_idx"
    });
    await queryInterface.addIndex("VoiceCalls", ["ticketId"], {
      name: "voice_calls_ticket_idx"
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex("VoiceCalls", "voice_calls_ticket_idx");
    await queryInterface.removeIndex(
      "VoiceCalls",
      "voice_calls_contact_started_idx"
    );
    for (const column of [
      "artifactError",
      "transcriptionModel",
      "transcriptionProvider",
      "transcriptSegments",
      "transcript",
      "recordingUrl",
      "artifactStatus",
      "transcriptionEnabled",
      "recordingEnabled",
      "ticketId",
      "contactId"
    ]) {
      await queryInterface.removeColumn("VoiceCalls", column);
    }
  }
};
