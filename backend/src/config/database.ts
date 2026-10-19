import "../bootstrap";

const integerEnvironment = (
  name: string,
  fallback: number,
  minimum = 0
): number => {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
};

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  pool: {
    max: integerEnvironment("DB_MAX_CONNECTIONS", 60, 1),
    min: integerEnvironment("DB_MIN_CONNECTIONS", 5),
    acquire: integerEnvironment("DB_ACQUIRE", 30000, 1),
    idle: integerEnvironment("DB_IDLE", 10000)
  },
  dialect: process.env.DB_DIALECT || "postgres",
  timezone: process.env.DB_TIMEZONE || "-03:00",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: process.env.DB_DEBUG && console.log,
  seederStorage: "sequelize"
};
