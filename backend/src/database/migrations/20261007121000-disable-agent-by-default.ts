import { QueryInterface } from "sequelize";

module.exports = {
  up: async (q: QueryInterface) => {
    await q.sequelize.transaction(async transaction => {
      await q.sequelize.query(
        'ALTER TABLE "AgentTenantPolicies" ALTER COLUMN "enabled" SET DEFAULT false',
        { transaction }
      );
      // Retire automatic opt-ins, preserving decisions saved by a super admin.
      await q.sequelize.query(
        `UPDATE "AgentTenantPolicies"
         SET "enabled" = false, "revision" = "revision" + 1,
             "documentStatus" = '{"state":"disabled"}'::jsonb,
             "updatedAt" = NOW()
         WHERE "enabled" = true AND "updatedById" IS NULL`,
        { transaction }
      );
    });
  },
  down: async (q: QueryInterface) => {
    // Rollback must not reactivate tenants without an administrator's decision.
    await q.sequelize.query(
      'ALTER TABLE "AgentTenantPolicies" ALTER COLUMN "enabled" SET DEFAULT true'
    );
  }
};
