// Production upgrades must target an existing installation. Initialization and
// data imports belong to a separate, explicit provisioning operation.
const { Client } = require("pg");

async function checkProductionDatabase(client) {
  const { rows } = await client.query(`
    SELECT to_regclass('public."Companies"') AS companies,
           to_regclass('public."Users"') AS users,
           to_regclass('public."SequelizeMeta"') AS migrations
  `);
  if (!rows[0]?.companies || !rows[0]?.users || !rows[0]?.migrations) {
    throw new Error("ERR_PRODUCTION_DATABASE_NOT_INITIALIZED");
  }
  const { rows: installation } = await client.query(`
    SELECT EXISTS(SELECT 1 FROM "Companies") AS companies,
           EXISTS(SELECT 1 FROM "Users") AS users
  `);
  if (!installation[0]?.companies || !installation[0]?.users) {
    throw new Error("ERR_PRODUCTION_DATABASE_EMPTY");
  }
}

async function main() {
  const config = require("../dist/config/database");
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 10000
  });
  try {
    await client.connect();
    await checkProductionDatabase(client);
    console.log(
      "Existing production installation verified; initialization skipped."
    );
  } catch {
    console.error(
      "Production database verification failed; startup stopped without initializing data."
    );
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (require.main === module) void main();
module.exports = { checkProductionDatabase };
