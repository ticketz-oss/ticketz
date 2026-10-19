import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (q: QueryInterface) => {
    await q.sequelize.transaction(async transaction => {
      await q.createTable(
        "WhatsappStatusPosts",
        {
          id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Companies", key: "id" },
            onDelete: "CASCADE"
          },
          whatsappId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Whatsapps", key: "id" },
            onDelete: "CASCADE"
          },
          createdByUserId: {
            type: DataTypes.INTEGER,
            references: { model: "Users", key: "id" },
            onDelete: "SET NULL"
          },
          kind: { type: DataTypes.STRING(10), allowNull: false },
          body: { type: DataTypes.TEXT },
          mediaPath: { type: DataTypes.STRING },
          mediaMime: { type: DataTypes.STRING(50) },
          backgroundColor: { type: DataTypes.STRING(9) },
          font: { type: DataTypes.INTEGER },
          audienceMode: { type: DataTypes.STRING(30), allowNull: false },
          contactListId: {
            type: DataTypes.INTEGER,
            references: { model: "ContactLists", key: "id" },
            onDelete: "SET NULL"
          },
          audienceCount: { type: DataTypes.INTEGER },
          scheduledAt: { type: DataTypes.DATE },
          state: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "draft"
          },
          remoteMessageId: { type: DataTypes.STRING },
          attemptStartedAt: { type: DataTypes.DATE },
          publishedAt: { type: DataTypes.DATE },
          expiresAt: { type: DataTypes.DATE },
          failureCode: { type: DataTypes.STRING(60) },
          idempotencyKey: { type: DataTypes.STRING(80), allowNull: false },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        },
        { transaction }
      );
      await q.addIndex("WhatsappStatusPosts", ["companyId", "idempotencyKey"], {
        unique: true,
        name: "whatsapp_status_posts_company_idempotency",
        transaction
      });
      await q.addIndex("WhatsappStatusPosts", ["companyId", "state"], {
        transaction
      });
      await q.addIndex("WhatsappStatusPosts", ["whatsappId", "state"], {
        transaction
      });
      await q.addIndex("WhatsappStatusPosts", ["companyId", "scheduledAt"], {
        transaction
      });
      await q.addIndex("WhatsappStatusPosts", ["companyId", "expiresAt"], {
        transaction
      });
    });
  },
  down: async (q: QueryInterface) => {
    await q.dropTable("WhatsappStatusPosts");
  }
};
