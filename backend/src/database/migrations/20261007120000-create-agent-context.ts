import { DataTypes, QueryInterface } from "sequelize";
module.exports = {
  up: async (q: QueryInterface) => {
    await q.sequelize.transaction(async transaction => {
      await q.createTable(
        "AgentTenantPolicies",
        {
          companyId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Companies", key: "id" },
            onDelete: "CASCADE"
          },
          enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          modules: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
          },
          businessContext: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
          },
          revision: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
          },
          updatedById: { type: DataTypes.INTEGER },
          documentStatus: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
          },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        },
        { transaction }
      );
      await q.createTable(
        "AgentContextAudits",
        {
          id: { type: DataTypes.UUID, primaryKey: true },
          companyId: { type: DataTypes.INTEGER, allowNull: false },
          userId: { type: DataTypes.INTEGER },
          event: { type: DataTypes.STRING, allowNull: false },
          module: { type: DataTypes.STRING },
          status: { type: DataTypes.STRING, allowNull: false },
          recordCount: { type: DataTypes.INTEGER },
          revision: { type: DataTypes.INTEGER },
          createdAt: { type: DataTypes.DATE, allowNull: false }
        },
        { transaction }
      );
      await q.addIndex("AgentContextAudits", ["companyId", "createdAt"], {
        transaction
      });
    });
  },
  down: async (q: QueryInterface) => {
    await q.dropTable("AgentContextAudits");
    await q.dropTable("AgentTenantPolicies");
  }
};
