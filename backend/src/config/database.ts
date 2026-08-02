import "../bootstrap";

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  pool: {
    max: Number(process.env.DB_MAX_CONNECTIONS) || 60,
    min: Number(process.env.DB_MIN_CONNECTIONS) || 5,
    acquire: Number(process.env.DB_ACQUIRE) || 30000,
    idle: Number(process.env.DB_IDLE) || 10000
  },
  dialect: process.env.DB_DIALECT || "postgres",
  timezone: process.env.DB_TIMEZONE || "-03:00",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: process.env.DB_DEBUG && console.log,
  seederStorage: "sequelize"
};
