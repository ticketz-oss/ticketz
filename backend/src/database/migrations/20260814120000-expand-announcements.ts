import { DataTypes, QueryInterface } from "sequelize";

const joinTable = (column: string, referencedTable: string) => ({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  announcementId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Announcements", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "CASCADE"
  },
  [column]: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: referencedTable, key: "id" },
    onUpdate: "CASCADE",
    onDelete: "CASCADE"
  },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
});

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const announcementColumns = [
      ["startsAt", { type: DataTypes.DATE, allowNull: true }],
      ["endsAt", { type: DataTypes.DATE, allowNull: true }],
      [
        "audienceMode",
        { type: DataTypes.STRING, allowNull: false, defaultValue: "ALL" }
      ],
      [
        "profiles",
        { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true }
      ],
      [
        "isGlobal",
        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
      ]
    ] as Array<[string, any]>;

    for (const [name, definition] of announcementColumns) {
      await queryInterface.addColumn("Announcements", name, definition);
    }

    // Until now every announcement was visible to every company, because the
    // listing never filtered by companyId. Keep that behaviour for the rows
    // that already exist so nobody loses a notice when the scoping kicks in.
    await queryInterface.sequelize.query(
      `UPDATE "Announcements" SET "isGlobal" = true`
    );

    await queryInterface.createTable(
      "AnnouncementUsers",
      joinTable("userId", "Users")
    );
    await queryInterface.addConstraint("AnnouncementUsers", {
      fields: ["announcementId", "userId"],
      type: "unique",
      name: "announcement_user_unique"
    });

    await queryInterface.createTable(
      "AnnouncementQueues",
      joinTable("queueId", "Queues")
    );
    await queryInterface.addConstraint("AnnouncementQueues", {
      fields: ["announcementId", "queueId"],
      type: "unique",
      name: "announcement_queue_unique"
    });

    await queryInterface.createTable(
      "AnnouncementWhatsapps",
      joinTable("whatsappId", "Whatsapps")
    );
    await queryInterface.addConstraint("AnnouncementWhatsapps", {
      fields: ["announcementId", "whatsappId"],
      type: "unique",
      name: "announcement_whatsapp_unique"
    });

    await queryInterface.addIndex("Announcements", [
      "companyId",
      "status",
      "startsAt",
      "endsAt"
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex("Announcements", [
      "companyId",
      "status",
      "startsAt",
      "endsAt"
    ]);
    await queryInterface.dropTable("AnnouncementWhatsapps");
    await queryInterface.dropTable("AnnouncementQueues");
    await queryInterface.dropTable("AnnouncementUsers");

    for (const column of [
      "isGlobal",
      "profiles",
      "audienceMode",
      "endsAt",
      "startsAt"
    ]) {
      await queryInterface.removeColumn("Announcements", column);
    }
  }
};
