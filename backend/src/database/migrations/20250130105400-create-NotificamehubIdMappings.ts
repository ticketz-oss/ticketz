import { DataTypes, QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("NotificamehubIdMappings", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      messageId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Tickets",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: {
        type: DataTypes.DATE(6),
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE(6),
        allowNull: false
      }
    });

    await queryInterface.addConstraint("NotificamehubIdMappings", {
      fields: ["messageId", "ticketId"],
      type: "unique",
      name: "NotificamehubIdMappings_messageId_ticketId_unique"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("NotificamehubIdMappings");
  }
};
