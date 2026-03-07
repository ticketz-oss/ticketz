import { QueryInterface, DataTypes, ModelAttributeColumnOptions } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableInfo = await queryInterface
      .describeTable("Whatsapps")
      .catch(() => ({}));

    const addIfNotExists = async (
      column: string,
      definition: ModelAttributeColumnOptions
    ) => {
      if (!tableInfo[column]) {
        await queryInterface.addColumn("Whatsapps", column, definition);
      }
    };

    await addIfNotExists("telegramToken", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await addIfNotExists("telegramBotName", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await addIfNotExists("emailSmtpHost", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await addIfNotExists("emailSmtpPort", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 587
    });

    await addIfNotExists("emailSmtpUser", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await addIfNotExists("emailSmtpPass", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await addIfNotExists("emailImapHost", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await addIfNotExists("emailImapPort", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 993
    });

    await addIfNotExists("emailFrom", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await addIfNotExists("instagramBusinessAccountId", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const cols = [
      "telegramToken",
      "telegramBotName",
      "emailSmtpHost",
      "emailSmtpPort",
      "emailSmtpUser",
      "emailSmtpPass",
      "emailImapHost",
      "emailImapPort",
      "emailFrom",
      "instagramBusinessAccountId"
    ];
    for (const col of cols) {
      await queryInterface
        .removeColumn("Whatsapps", col)
        .catch(() => {});
    }
  }
};
