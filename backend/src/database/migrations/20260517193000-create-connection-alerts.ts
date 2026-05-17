import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ConnectionAlerts", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Companies",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      connectionName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      connectionChannel: {
        type: DataTypes.STRING,
        allowNull: false
      },
      occurredAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      severity: {
        type: DataTypes.STRING,
        allowNull: false
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true
      },
      emailStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending"
      },
      emailError: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      recipientCount: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      emailedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      viewed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      viewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true
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

    await queryInterface.addIndex(
      "ConnectionAlerts",
      ["companyId", "occurredAt"],
      {
        name: "idx_connection_alerts_company_occurred_at"
      }
    );
    await queryInterface.addIndex("ConnectionAlerts", ["eventType"], {
      name: "idx_connection_alerts_event_type"
    });
    await queryInterface.addIndex("ConnectionAlerts", ["viewed"], {
      name: "idx_connection_alerts_viewed"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ConnectionAlerts");
  }
};