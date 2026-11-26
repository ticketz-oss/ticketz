import { DataTypes, QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async transaction => {
    await queryInterface.createTable(
      "BaileysSessions",
      {
        id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
        whatsappId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "Whatsapps", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        credentials: { type: DataTypes.TEXT, allowNull: true },
        retiredAt: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      },
      { transaction }
    );
    await queryInterface.addConstraint("BaileysSessions", {
      fields: ["id", "whatsappId"],
      type: "unique",
      name: "baileys_sessions_id_whatsapp_unique",
      transaction
    });
    await queryInterface.addIndex("BaileysSessions", ["whatsappId"], {
      name: "baileys_sessions_whatsapp_id_idx",
      transaction
    });
    await queryInterface.addColumn(
      "Whatsapps",
      "activeBaileysSessionId",
      { type: DataTypes.UUID, allowNull: true },
      { transaction }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "Whatsapps"
       ADD CONSTRAINT "whatsapps_active_baileys_session_owner_fk"
       FOREIGN KEY ("activeBaileysSessionId", "id")
       REFERENCES "BaileysSessions" ("id", "whatsappId")`,
      { transaction }
    );
    await queryInterface.createTable(
      "BaileysSessionKeys",
      {
        sessionId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: { model: "BaileysSessions", key: "id" },
          onDelete: "CASCADE"
        },
        type: { type: DataTypes.TEXT, primaryKey: true, allowNull: false },
        key: { type: DataTypes.TEXT, primaryKey: true, allowNull: false },
        value: { type: DataTypes.TEXT, allowNull: false }
      },
      { transaction }
    );
    await queryInterface.createTable(
      "BaileysSessionContacts",
      {
        sessionId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: { model: "BaileysSessions", key: "id" },
          onDelete: "CASCADE"
        },
        contactId: { type: DataTypes.TEXT, primaryKey: true, allowNull: false },
        payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      },
      { transaction }
    );
  });
}

export async function down(): Promise<void> {
  throw new Error(
    "Cannot downgrade Baileys session isolation without a verified credential export"
  );
}
