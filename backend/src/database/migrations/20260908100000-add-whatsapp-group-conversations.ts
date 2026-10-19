import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Contacts", "groupMode", {
      type: DataTypes.STRING(20),
      allowNull: true
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE "Contacts"
      ADD CONSTRAINT "contacts_group_mode_check"
      CHECK ("groupMode" IS NULL OR "groupMode" IN ('conversation', 'ticket'));
    `);

    await queryInterface.sequelize.query(`
      UPDATE "Contacts"
      SET "groupMode" = 'conversation'
      WHERE "isGroup" = true;
    `);

    await queryInterface.createTable("GroupQueues", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      groupContactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      queueId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addConstraint("GroupQueues", {
      fields: ["groupContactId", "queueId"],
      type: "unique",
      name: "group_queues_contact_queue_unique"
    });
    await queryInterface.addIndex("GroupQueues", ["companyId", "queueId"]);

    await queryInterface.createTable("GroupReadStates", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      unreadCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastReadAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addConstraint("GroupReadStates", {
      fields: ["ticketId", "userId"],
      type: "unique",
      name: "group_read_states_ticket_user_unique"
    });
    await queryInterface.addIndex("GroupReadStates", ["companyId", "userId"]);

    await queryInterface.createTable("GroupSettingSnapshots", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      activationId: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      checkMsgIsGroup: { type: DataTypes.STRING, allowNull: true },
      groupsTab: { type: DataTypes.STRING, allowNull: true },
      soundGroupNotifications: { type: DataTypes.STRING, allowNull: true },
      revertedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addConstraint("GroupSettingSnapshots", {
      fields: ["activationId", "companyId"],
      type: "unique",
      name: "group_setting_snapshots_activation_company_unique"
    });

    await queryInterface.sequelize.query(`
      INSERT INTO "GroupQueues"
        ("groupContactId", "queueId", "companyId", "createdAt", "updatedAt")
      SELECT DISTINCT source."contactId", source."queueId", source."companyId", NOW(), NOW()
      FROM (
        SELECT t."contactId", t."queueId", t."companyId"
        FROM "Tickets" t
        WHERE t."isGroup" = true AND t."queueId" IS NOT NULL
        UNION
        SELECT t."contactId", wq."queueId", t."companyId"
        FROM "Tickets" t
        JOIN "WhatsappQueues" wq ON wq."whatsappId" = t."whatsappId"
        WHERE t."isGroup" = true
      ) source
      WHERE NOT EXISTS (
        SELECT 1 FROM "GroupQueues" gq
        WHERE gq."groupContactId" = source."contactId"
          AND gq."queueId" = source."queueId"
      );
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("GroupSettingSnapshots");
    await queryInterface.dropTable("GroupReadStates");
    await queryInterface.dropTable("GroupQueues");
    await queryInterface.removeConstraint(
      "Contacts",
      "contacts_group_mode_check"
    );
    await queryInterface.removeColumn("Contacts", "groupMode");
  }
};
