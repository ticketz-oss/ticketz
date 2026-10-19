import { QueryInterface, DataTypes, QueryTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      const columns = await queryInterface.describeTable("Companies");
      if (!columns.whatsappMode) {
        await queryInterface.addColumn(
          "Companies",
          "whatsappMode",
          {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "normal"
          },
          { transaction }
        );
      }

      // Decide from persisted provider evidence, never from a tenant name/id.
      // Mixed tenants require an explicit data repair; silently choosing a
      // provider would strand existing sessions or change their transport.
      const mixed = await queryInterface.sequelize.query<{ companyId: number }>(
        `
        SELECT w."companyId" FROM "Whatsapps" w
        JOIN "Companies" c ON c.id = w."companyId"
        WHERE w."channel" = 'whatsapp'
        GROUP BY w."companyId", c."whatsappMode"
        HAVING bool_or(w."apiMode" = 'baileys')
          AND (bool_or(w."apiMode" = 'official') OR c."whatsappMode" = 'meta')
      `,
        { transaction, type: QueryTypes.SELECT }
      );
      if (mixed.length) {
        throw new Error(
          `Mixed WhatsApp providers require review for companies: ${mixed.map(row => row.companyId).join(", ")}`
        );
      }

      await queryInterface.sequelize.query(
        `
        UPDATE "Companies" AS c SET "whatsappMode" = 'meta'
        WHERE EXISTS (
          SELECT 1 FROM "Whatsapps" AS w
          WHERE w."companyId" = c.id AND w."apiMode" = 'official'
        );
        ALTER TABLE "Companies" DROP CONSTRAINT IF EXISTS "companies_whatsapp_mode_check";
        ALTER TABLE "Companies" ADD CONSTRAINT "companies_whatsapp_mode_check"
          CHECK ("whatsappMode" IN ('normal', 'meta'));
        CREATE FUNCTION prevent_company_whatsapp_mode_change() RETURNS trigger AS $$
        BEGIN
          IF NEW."whatsappMode" IS DISTINCT FROM OLD."whatsappMode" THEN
            RAISE EXCEPTION 'ERR_COMPANY_WHATSAPP_MODE_IMMUTABLE';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        CREATE TRIGGER company_whatsapp_mode_immutable
          BEFORE UPDATE OF "whatsappMode" ON "Companies"
          FOR EACH ROW EXECUTE FUNCTION prevent_company_whatsapp_mode_change();
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Preserve the persisted provider choice during rollback. Dropping it
    // would let an official tenant become an unofficial tenant on upgrade.
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS company_whatsapp_mode_immutable ON "Companies";
      DROP FUNCTION IF EXISTS prevent_company_whatsapp_mode_change();
    `);
  }
};
