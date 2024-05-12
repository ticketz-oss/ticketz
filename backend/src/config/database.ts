import "../bootstrap";

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  dialect: process.env.DB_DIALECT || "mysql",
  timezone: "-03:00",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: process.env.DB_DEBUG === "true",
  seederStorage: "sequelize",
  dialectOptions: { //This options for SSL connection in my version
    ssl: {
      require: true, // This will enforce SSL connection
      rejectUnauthorized: true // This should be set to true in production for security reasons
    }
  }
};
