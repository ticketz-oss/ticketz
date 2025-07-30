import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Tasks", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      title: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      status: {
        type: DataTypes.ENUM("open", "done"),
        allowNull: false,
        defaultValue: "open"
      },

      startedAt: {
        type: DataTypes.DATE(6),
        allowNull: true
      },

      isPrivate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },

      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
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
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("Tasks");
  }
};
