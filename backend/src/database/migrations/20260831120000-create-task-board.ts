import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("TaskBoardColumns", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: { type: DataTypes.STRING(120), allowNull: false },
      color: { type: DataTypes.STRING(7), allowNull: true },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      isDone: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
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

    await queryInterface.addIndex("TaskBoardColumns", [
      "companyId",
      "position"
    ]);
    await queryInterface.addIndex("TaskBoardColumns", ["companyId"], {
      unique: true,
      where: { isDone: true },
      name: "task_board_columns_one_done_per_company"
    });

    await queryInterface.createTable("TaskBoardTasks", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      columnId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "TaskBoardColumns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("TaskBoardTasks", [
      "companyId",
      "columnId",
      "position"
    ]);
    await queryInterface.addIndex("TaskBoardTasks", [
      "companyId",
      "completedAt"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("TaskBoardTasks");
    await queryInterface.dropTable("TaskBoardColumns");
  }
};
