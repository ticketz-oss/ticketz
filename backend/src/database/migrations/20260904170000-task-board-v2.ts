import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("TaskBoardTasks", "description", {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    });
    await queryInterface.addColumn("TaskBoardTasks", "targetType", {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: "GLOBAL"
    });
    await queryInterface.addColumn("TaskBoardTasks", "assignedUserId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });
    await queryInterface.addColumn("TaskBoardTasks", "assignedQueueId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Queues", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });
    await queryInterface.addColumn("TaskBoardTasks", "dueAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("TaskBoardTasks", "completedById", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addColumn("TaskBoardTasks", "createdById", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addColumn("TaskBoardTasks", "version", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "TaskBoardTasks"
      ADD CONSTRAINT "task_board_tasks_target_type_valid"
      CHECK ("targetType" IN ('GLOBAL', 'USER', 'QUEUE')),
      ADD CONSTRAINT "task_board_tasks_target_coherent" CHECK (
        ("targetType" = 'GLOBAL' AND "assignedUserId" IS NULL AND "assignedQueueId" IS NULL) OR
        ("targetType" = 'USER' AND "assignedUserId" IS NOT NULL AND "assignedQueueId" IS NULL) OR
        ("targetType" = 'QUEUE' AND "assignedUserId" IS NULL AND "assignedQueueId" IS NOT NULL)
      )
    `);
    await queryInterface.addIndex("TaskBoardTasks", [
      "companyId",
      "targetType",
      "assignedUserId"
    ]);
    await queryInterface.addIndex("TaskBoardTasks", [
      "companyId",
      "targetType",
      "assignedQueueId"
    ]);
    await queryInterface.addIndex("TaskBoardTasks", ["companyId", "dueAt"]);

    await queryInterface.createTable("TaskBoardEvents", {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "TaskBoardTasks", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      eventType: { type: DataTypes.STRING(16), allowNull: false },
      fromColumnId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "TaskBoardColumns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      toColumnId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "TaskBoardColumns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      data: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE "TaskBoardEvents"
      ADD CONSTRAINT "task_board_events_type_valid"
      CHECK ("eventType" IN ('CREATED', 'EDITED', 'MOVED', 'COMPLETED', 'REOPENED'))
    `);
    await queryInterface.addIndex("TaskBoardEvents", [
      "companyId",
      "taskId",
      "createdAt"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("TaskBoardEvents");
    await queryInterface.removeConstraint(
      "TaskBoardTasks",
      "task_board_tasks_target_coherent"
    );
    await queryInterface.removeConstraint(
      "TaskBoardTasks",
      "task_board_tasks_target_type_valid"
    );
    await Promise.all(
      [
        "version",
        "createdById",
        "completedById",
        "dueAt",
        "assignedQueueId",
        "assignedUserId",
        "targetType",
        "description"
      ].map(column => queryInterface.removeColumn("TaskBoardTasks", column))
    );
  }
};
