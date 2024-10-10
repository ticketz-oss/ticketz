import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("IntegrationSessions", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: true
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
      integrationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Integrations",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
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
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("IntegrationSessions");
  }
};
