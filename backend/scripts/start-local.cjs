// Local startup keeps seeded installations intact and initializes a fresh DB once.
const { execFileSync } = require("child_process");
const { Pool } = require("pg");
const path = require("path");
const cli = path.resolve(__dirname, "../node_modules/sequelize-cli/lib/sequelize");
const buildDirectory = process.env.LOCAL_BUILD_DIR || "dist";
async function start() {
  execFileSync(process.execPath, [cli, "db:migrate", "--config", `${buildDirectory}/config/database.js`, "--migrations-path", `${buildDirectory}/database/migrations`], { stdio: "inherit" });
  const db = new Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME });
  const result = await db.query('SELECT COUNT(*)::int AS count FROM "Users"');
  await db.end();
  if (result.rows[0].count === 0) {
    execFileSync(process.execPath, [cli, "db:seed:all", "--config", `${buildDirectory}/config/database.js`, "--seeders-path", `${buildDirectory}/database/seeds`], { stdio: "inherit" });
  }
  require(path.resolve(__dirname, "..", buildDirectory, "server"));
}
start().catch(() => { console.error("Local initialization failed; check migrations and database availability."); process.exit(1); });
