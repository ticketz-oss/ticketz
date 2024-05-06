import "../bootstrap";

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  options: {
    requestTimeout: 600000,
    encrypt: true,
  },
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 100
  },
  pool: {
    max: 200,
    min: 15,
    acquire: 30000,
    idle: 600000
  },
    dialect: process.env.DB_DIALECT || "postgres",
    timezone: "-03:00",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    logging: process.env.DB_DEBUG === "true",
  seederStorage: "sequelize",
};
