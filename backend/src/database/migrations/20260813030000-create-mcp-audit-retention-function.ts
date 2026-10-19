import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION delete_expired_mcp_audits()
      RETURNS integer LANGUAGE plpgsql AS $$
      DECLARE deleted_count integer;
      BEGIN
        DELETE FROM "McpAudits" WHERE "createdAt" < NOW() - INTERVAL '90 days';
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$;
    `);
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      "DROP FUNCTION IF EXISTS delete_expired_mcp_audits()"
    );
  }
};
