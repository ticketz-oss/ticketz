/* Runs only against a disposable PostgreSQL server supplied explicitly by the
 * caller. Creates and drops its own random database; never migrates the supplied
 * database. Example: WHATSAPP_MIGRATION_TEST_URL=postgres://... node scripts/test-whatsapp-provider-migrations.cjs
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ts = require("typescript");
const { Sequelize } = require("sequelize");

if (!process.env.WHATSAPP_MIGRATION_TEST_URL) {
  throw new Error(
    "Supply WHATSAPP_MIGRATION_TEST_URL pointing to a disposable PostgreSQL server"
  );
}
require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  });
  module._compile(result.outputText, filename);
};
const migration = name =>
  require(path.resolve(__dirname, "../src/database/migrations", name));
const meta = migration(
  "20260915120100-add-meta-cloud-api-fields-to-whatsapps.ts"
);
const company = migration("20260928100000-company-whatsapp-mode.ts");
const unique = migration("20260928100100-unique-meta-phone-number.ts");
const database = `provider_audit_${crypto.randomBytes(8).toString("hex")}`;
const admin = new Sequelize(process.env.WHATSAPP_MIGRATION_TEST_URL, {
  logging: false
});
const url = new URL(process.env.WHATSAPP_MIGRATION_TEST_URL);
url.pathname = `/${database}`;
const db = new Sequelize(url.toString(), { logging: false });
const qi = db.getQueryInterface();
const reset = async () => {
  await db.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await db.query(`CREATE TABLE "Companies" (id INTEGER PRIMARY KEY);
    CREATE TABLE "Whatsapps" (id INTEGER PRIMARY KEY, "companyId" INTEGER REFERENCES "Companies"(id), channel TEXT NOT NULL DEFAULT 'whatsapp');
    INSERT INTO "Companies" (id) VALUES (1),(2),(3);`);
};
const rejects = async (sql, pattern) =>
  assert.rejects(() => db.query(sql), pattern);

(async () => {
  await admin.query(`CREATE DATABASE "${database}"`);
  try {
    await reset();
    await meta.up(qi);
    await db.query(
      `INSERT INTO "Whatsapps" (id,"companyId","apiMode") VALUES (1,1,'official'),(2,2,'baileys')`
    );
    await company.up(qi);
    await unique.up(qi);
    const [rows] = await db.query(
      'SELECT id,"whatsappMode" FROM "Companies" ORDER BY id'
    );
    assert.deepEqual(
      rows.map(row => row.whatsappMode),
      ["meta", "normal", "normal"]
    );
    await rejects(
      `UPDATE "Companies" SET "whatsappMode"='normal' WHERE id=1`,
      /IMMUTABLE/
    );
    await rejects(
      `UPDATE "Companies" SET "whatsappMode"='meta' WHERE id=2`,
      /IMMUTABLE/
    );
    await db.query(`UPDATE "Companies" SET "whatsappMode"='meta' WHERE id=1`);
    await rejects(
      `INSERT INTO "Companies" (id,"whatsappMode") VALUES (4,'invalid')`,
      /check constraint/
    );
    await db.query(
      `UPDATE "Whatsapps" SET "metaPhoneNumberId"='phone-1' WHERE id=1`
    );
    await rejects(
      `UPDATE "Whatsapps" SET "metaPhoneNumberId"='phone-1' WHERE id=2`,
      /SequelizeUniqueConstraintError/
    );
    console.log(
      "PASS fresh installation: provider backfill, defaults, immutable mode, unique phone mapping"
    );

    await reset();
    await meta.up(qi);
    await db.query(`ALTER TABLE "Companies" ADD COLUMN "whatsappMode" VARCHAR(255) NOT NULL DEFAULT 'normal';
      UPDATE "Companies" SET "whatsappMode"='meta' WHERE id=1;
      INSERT INTO "Whatsapps" (id,"companyId","apiMode") VALUES (1,1,'official'),(2,2,'baileys');
      CREATE TABLE "SequelizeMeta" (name VARCHAR(255) PRIMARY KEY);
      INSERT INTO "SequelizeMeta" VALUES ('20260915120100-add-meta-cloud-api-fields-to-whatsapps.ts');`);
    await company.up(qi);
    await unique.up(qi);
    await rejects(
      `UPDATE "Companies" SET "whatsappMode"='normal' WHERE id=1`,
      /IMMUTABLE/
    );
    console.log(
      "PASS existing ACNorte schema: preserves official mode and accepts new migrations"
    );

    await reset();
    await meta.up(qi);
    await db.query(
      `INSERT INTO "Whatsapps" (id,"companyId","apiMode") VALUES (1,1,'official'),(2,1,'baileys')`
    );
    await assert.rejects(() => company.up(qi), /Mixed WhatsApp providers/);
    const columns = await qi.describeTable("Companies");
    assert.equal(columns.whatsappMode, undefined);
    const [connections] = await db.query(
      'SELECT "apiMode" FROM "Whatsapps" ORDER BY id'
    );
    assert.deepEqual(
      connections.map(row => row.apiMode),
      ["official", "baileys"]
    );
    console.log(
      "PASS mixed providers: migration fails and rolls back without changing connections"
    );
  } finally {
    await db.close();
    await admin.query(`DROP DATABASE "${database}"`);
    await admin.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
