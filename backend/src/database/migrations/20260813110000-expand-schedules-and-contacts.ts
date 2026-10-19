import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("Contacts", "nickname", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    });
    await queryInterface.addColumn("Contacts", "birthdayDay", {
      type: DataTypes.SMALLINT,
      allowNull: true
    });
    await queryInterface.addColumn("Contacts", "birthdayMonth", {
      type: DataTypes.SMALLINT,
      allowNull: true
    });

    await queryInterface.createTable("CommemorativeDates", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      ruleType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "FIXED_DATE"
      },
      month: { type: DataTypes.SMALLINT, allowNull: false },
      day: { type: DataTypes.SMALLINT, allowNull: true },
      weekday: { type: DataTypes.SMALLINT, allowNull: true },
      ordinal: { type: DataTypes.SMALLINT, allowNull: true },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
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
    await queryInterface.addIndex("CommemorativeDates", [
      "companyId",
      "active"
    ]);

    const scheduleColumns = [
      [
        "kind",
        { type: DataTypes.STRING, allowNull: false, defaultValue: "ONCE" }
      ],
      [
        "audienceMode",
        { type: DataTypes.STRING, allowNull: false, defaultValue: "SELECTED" }
      ],
      ["sendTime", { type: DataTypes.STRING, allowNull: true }],
      ["timezone", { type: DataTypes.STRING, allowNull: true }],
      ["nextRunAt", { type: DataTypes.DATE, allowNull: true }],
      ["mediaPath", { type: DataTypes.TEXT, allowNull: true }],
      ["mediaName", { type: DataTypes.TEXT, allowNull: true }],
      ["mediaType", { type: DataTypes.STRING, allowNull: true }],
      [
        "mediaDeliveryMode",
        { type: DataTypes.STRING, allowNull: false, defaultValue: "CAPTION" }
      ],
      [
        "totalRecipients",
        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
      ],
      [
        "sentCount",
        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
      ],
      [
        "errorCount",
        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
      ],
      ["lastRunAt", { type: DataTypes.DATE, allowNull: true }],
      [
        "active",
        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
      ],
      [
        "commemorativeDateId",
        {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "CommemorativeDates", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        }
      ]
    ] as Array<[string, any]>;

    for (const [name, definition] of scheduleColumns) {
      await queryInterface.addColumn("Schedules", name, definition);
    }

    await queryInterface.sequelize.query(
      `UPDATE "Schedules" SET "nextRunAt" = "sendAt" WHERE "nextRunAt" IS NULL`
    );
    await queryInterface.sequelize.query(
      `UPDATE "Schedules"
       SET active = false, "nextRunAt" = NULL
       WHERE "sentAt" IS NOT NULL OR status IN ('ENVIADA', 'ERRO')`
    );

    await queryInterface.createTable("ScheduleAudienceContacts", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Schedules", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addConstraint("ScheduleAudienceContacts", {
      fields: ["scheduleId", "contactId"],
      type: "unique",
      name: "schedule_audience_contact_unique"
    });

    await queryInterface.createTable("ScheduleDeliveries", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Schedules", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      occurrenceKey: { type: DataTypes.STRING, allowNull: false },
      scheduledAt: { type: DataTypes.DATE, allowNull: false },
      queuedAt: { type: DataTypes.DATE, allowNull: true },
      sentAt: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PENDING"
      },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },
      contactName: { type: DataTypes.STRING, allowNull: true },
      contactNumber: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addConstraint("ScheduleDeliveries", {
      fields: ["scheduleId", "contactId", "occurrenceKey"],
      type: "unique",
      name: "schedule_delivery_occurrence_unique"
    });
    await queryInterface.addIndex("ScheduleDeliveries", [
      "scheduleId",
      "status"
    ]);
    await queryInterface.addIndex("Schedules", ["active", "nextRunAt"]);

    const schedules = (await queryInterface.sequelize.query(
      `SELECT id, "contactId", "sendAt", "sentAt", status, "createdAt", "updatedAt"
       FROM "Schedules" WHERE "contactId" IS NOT NULL`,
      { type: QueryTypes.SELECT }
    )) as any[];

    if (schedules.length) {
      const audience = schedules.map(schedule => ({
        scheduleId: schedule.id,
        contactId: schedule.contactId,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }));
      const deliveries = schedules.map(schedule => ({
        scheduleId: schedule.id,
        contactId: schedule.contactId,
        occurrenceKey: `once-${schedule.id}`,
        scheduledAt: schedule.sendAt || schedule.createdAt,
        sentAt: schedule.sentAt,
        status:
          schedule.status === "ENVIADA"
            ? "SENT"
            : schedule.status === "ERRO"
              ? "ERROR"
              : "PENDING",
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }));
      await queryInterface.bulkInsert("ScheduleAudienceContacts", audience);
      await queryInterface.bulkInsert("ScheduleDeliveries", deliveries);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("ScheduleDeliveries");
    await queryInterface.dropTable("ScheduleAudienceContacts");

    const scheduleColumns = [
      "commemorativeDateId",
      "active",
      "lastRunAt",
      "errorCount",
      "sentCount",
      "totalRecipients",
      "mediaDeliveryMode",
      "mediaType",
      "mediaName",
      "mediaPath",
      "nextRunAt",
      "timezone",
      "sendTime",
      "audienceMode",
      "kind"
    ];
    for (const column of scheduleColumns) {
      await queryInterface.removeColumn("Schedules", column);
    }

    await queryInterface.dropTable("CommemorativeDates");
    await queryInterface.removeColumn("Contacts", "birthdayMonth");
    await queryInterface.removeColumn("Contacts", "birthdayDay");
    await queryInterface.removeColumn("Contacts", "nickname");
  }
};
