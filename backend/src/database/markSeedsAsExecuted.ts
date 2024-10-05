import fs from "fs";
import { Sequelize } from "sequelize";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbConfig = require("../config/database");

const sequelize = new Sequelize(dbConfig);
const seedsDir = "dist/database/seeds";

function getSeedFiles() {
  return fs.readdirSync(seedsDir).filter(file => file.endsWith(".js"));
}

async function markSeedsAsExecuted() {
  const seedFiles = getSeedFiles();

  if (seedFiles.length === 0) {
    console.log("No seed files found in the seeds directory.");
    return;
  }

  console.log(
    `Found ${seedFiles.length} seed files. Marking them as executed...`
  );

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeData" (
        "name" VARCHAR(255),
        PRIMARY KEY ("name")
      )
    `);

    await sequelize.query(
      `INSERT INTO "SequelizeData" (name) VALUES ${seedFiles
        .map(seed => `('${seed}')`)
        .join(", ")}`
    );
    console.log("All seeds marked as executed successfully!");
  } catch (error) {
    console.error("Error marking seeds as executed:", error);
  } finally {
    await sequelize.close();
  }
}

markSeedsAsExecuted();
