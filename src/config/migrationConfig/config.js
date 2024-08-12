require("dotenv").config();

module.exports = {
  dev: {
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    migrationStorageTableName: "sequelize_migrations",
    seederStorageTableName: "sequelize_seeds",
    seederStorage: "sequelize",
  },
  test: {
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    migrationStorageTableName: "sequelize_migrations",
    seederStorageTableName: "sequelize_seeds",
    seederStorage: "sequelize",
  },
  production: {
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    migrationStorageTableName: "sequelize_migrations",
    seederStorageTableName: "sequelize_seeds",
    seederStorage: "sequelize",
  },
};
