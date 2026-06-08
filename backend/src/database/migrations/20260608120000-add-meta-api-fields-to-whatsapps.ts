import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // phoneNumberId: ID do número na Meta (Phone Number ID)
    await queryInterface.addColumn("Whatsapps", "phoneNumberId", {
      type: DataTypes.STRING,
      allowNull: true
    });

    // wabaId: WhatsApp Business Account ID
    await queryInterface.addColumn("Whatsapps", "wabaId", {
      type: DataTypes.STRING,
      allowNull: true
    });

    // webhookVerifyToken: token customizado para verificação do webhook
    await queryInterface.addColumn("Whatsapps", "webhookVerifyToken", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Whatsapps", "phoneNumberId");
    await queryInterface.removeColumn("Whatsapps", "wabaId");
    await queryInterface.removeColumn("Whatsapps", "webhookVerifyToken");
  }
};
