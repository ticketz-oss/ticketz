import "../bootstrap";

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  pool: {
    max: process.env.DB_MAX_CONNECTIONS || 60,
    min: process.env.DB_MIN_CONNECTIONS || 5,
    acquire: process.env.DB_ACQUIRE || 30000,
    idle: process.env.DB_IDLE || 10000
  },
  dialect: process.env.DB_DIALECT || "mysql",
  timezone: process.env.DB_TIMEZONE || "-03:00",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: process.env.DB_DEBUG && console.log,
  seederStorage: "sequelize"
};
