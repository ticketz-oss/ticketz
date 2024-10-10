import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Integrations", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      driver: {
        type: DataTypes.STRING,
        allowNull: false
      },
      configuration: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      queueId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Queues",
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
    return queryInterface.dropTable("Integrations");
  }
};
