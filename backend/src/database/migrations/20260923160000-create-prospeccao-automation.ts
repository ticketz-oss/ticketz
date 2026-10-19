import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ProspeccaoAutomacoes", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "Companies", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Whatsapps", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      minDelaySeconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 180
      },
      maxDelaySeconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 420
      },
      dailyLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      acknowledgedRisk: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ProspeccaoAgendas", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      automationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "ProspeccaoAutomacoes", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      time: { type: DataTypes.STRING(5), allowNull: false },
      nicho: { type: DataTypes.STRING(120), allowNull: false },
      countryCode: { type: DataTypes.STRING(2), allowNull: false },
      countryName: { type: DataTypes.STRING(120), allowNull: false },
      stateCode: { type: DataTypes.STRING(20), allowNull: true },
      stateName: { type: DataTypes.STRING(120), allowNull: true },
      cityName: { type: DataTypes.STRING(120), allowNull: true },
      maxResults: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      product: { type: DataTypes.STRING(60), allowNull: false },
      tone: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "media"
      },
      onlyWhatsapp: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("ProspeccaoAgendas", ["companyId", "time"]);

    await queryInterface.createTable("ProspeccaoExecucoes", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "ProspeccaoAgendas", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      localDate: { type: DataTypes.DATEONLY, allowNull: false },
      jobId: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "DUE"
      },
      totalLeads: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      newLeads: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },
      startedAt: { type: DataTypes.DATE, allowNull: true },
      finishedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addConstraint("ProspeccaoExecucoes", {
      fields: ["scheduleId", "localDate"],
      type: "unique",
      name: "prospeccao_execucoes_schedule_day_unique"
    });
    await queryInterface.addIndex("ProspeccaoExecucoes", [
      "companyId",
      "status"
    ]);

    const leadColumns: Array<[string, any]> = [
      [
        "executionId",
        {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "ProspeccaoExecucoes", key: "id" },
          onDelete: "SET NULL",
          onUpdate: "CASCADE"
        }
      ],
      [
        "origin",
        { type: DataTypes.STRING(15), allowNull: false, defaultValue: "MANUAL" }
      ],
      ["deliveryStatus", { type: DataTypes.STRING(30), allowNull: true }],
      [
        "sendAttempts",
        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
      ],
      ["scheduledSendAt", { type: DataTypes.DATE, allowNull: true }],
      ["autoSentAt", { type: DataTypes.DATE, allowNull: true }],
      ["repliedAt", { type: DataTypes.DATE, allowNull: true }],
      ["closeDueAt", { type: DataTypes.DATE, allowNull: true }],
      ["deliveryError", { type: DataTypes.TEXT, allowNull: true }]
    ];
    for (const [name, definition] of leadColumns) {
      await queryInterface.addColumn("ProspeccaoLeads", name, definition);
    }
    await queryInterface.addIndex("ProspeccaoLeads", [
      "companyId",
      "deliveryStatus"
    ]);
    await queryInterface.addIndex("ProspeccaoLeads", ["closeDueAt"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("ProspeccaoLeads", ["closeDueAt"]);
    await queryInterface.removeIndex("ProspeccaoLeads", [
      "companyId",
      "deliveryStatus"
    ]);
    for (const name of [
      "deliveryError",
      "closeDueAt",
      "repliedAt",
      "autoSentAt",
      "scheduledSendAt",
      "sendAttempts",
      "deliveryStatus",
      "origin",
      "executionId"
    ]) {
      await queryInterface.removeColumn("ProspeccaoLeads", name);
    }
    await queryInterface.dropTable("ProspeccaoExecucoes");
    await queryInterface.dropTable("ProspeccaoAgendas");
    await queryInterface.dropTable("ProspeccaoAutomacoes");
  }
};
