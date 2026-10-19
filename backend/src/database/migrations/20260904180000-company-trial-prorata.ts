import { DataTypes, QueryInterface, Transaction } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(
      async (transaction: Transaction) => {
        await queryInterface.addColumn(
          "Companies",
          "trialDays",
          {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          { transaction }
        );
        await queryInterface.addColumn(
          "Companies",
          "trialEndsAt",
          {
            type: DataTypes.DATEONLY,
            allowNull: true
          },
          { transaction }
        );
        await queryInterface.addColumn(
          "Companies",
          "dueDay",
          {
            type: DataTypes.SMALLINT,
            allowNull: true
          },
          { transaction }
        );
        await queryInterface.sequelize.query(
          `UPDATE "Companies" SET "dueDay" = EXTRACT(DAY FROM "dueDate"::date)::smallint
         WHERE "dueDate" IS NOT NULL AND "dueDate"::text ~ '^\\d{4}-\\d{2}-\\d{2}'`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `ALTER TABLE "Companies"
         ADD CONSTRAINT "companies_trial_days_valid" CHECK ("trialDays" BETWEEN 0 AND 3650),
         ADD CONSTRAINT "companies_due_day_valid" CHECK ("dueDay" IS NULL OR "dueDay" BETWEEN 1 AND 31)`,
          { transaction }
        );

        await queryInterface.addColumn(
          "Invoices",
          "billingType",
          {
            type: DataTypes.STRING(24),
            allowNull: false,
            defaultValue: "regular"
          },
          { transaction }
        );
        await queryInterface.addColumn(
          "Invoices",
          "periodStart",
          {
            type: DataTypes.DATEONLY,
            allowNull: true
          },
          { transaction }
        );
        await queryInterface.addColumn(
          "Invoices",
          "periodEnd",
          {
            type: DataTypes.DATEONLY,
            allowNull: true
          },
          { transaction }
        );
        await queryInterface.sequelize.query(
          `ALTER TABLE "Invoices"
         ADD CONSTRAINT "invoices_billing_type_valid"
         CHECK ("billingType" IN ('regular', 'initial_prorata'))`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `CREATE UNIQUE INDEX "invoices_one_initial_prorata_per_company"
         ON "Invoices" ("companyId") WHERE "billingType" = 'initial_prorata'`,
          { transaction }
        );
      }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(
      async (transaction: Transaction) => {
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "invoices_one_initial_prorata_per_company"`,
          { transaction }
        );
        await queryInterface.removeConstraint(
          "Invoices",
          "invoices_billing_type_valid",
          { transaction }
        );
        await queryInterface.removeColumn("Invoices", "periodEnd", {
          transaction
        });
        await queryInterface.removeColumn("Invoices", "periodStart", {
          transaction
        });
        await queryInterface.removeColumn("Invoices", "billingType", {
          transaction
        });
        await queryInterface.removeConstraint(
          "Companies",
          "companies_due_day_valid",
          { transaction }
        );
        await queryInterface.removeConstraint(
          "Companies",
          "companies_trial_days_valid",
          { transaction }
        );
        await queryInterface.removeColumn("Companies", "dueDay", {
          transaction
        });
        await queryInterface.removeColumn("Companies", "trialEndsAt", {
          transaction
        });
        await queryInterface.removeColumn("Companies", "trialDays", {
          transaction
        });
      }
    );
  }
};
