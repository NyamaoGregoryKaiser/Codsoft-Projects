// This file is used by the `sequelize` instance in `models/index.js`
// For sequelize-cli migrations/seeders, it typically uses `config/config.json`
// or a JS file referenced by `.sequelizerc` that exports an object.
// Here we are centralizing using environment variables.

const config = require('../config');

const dbConfig = {
  development: {
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false, // Set to console.log to see SQL queries
    operatorsAliases: false,
  },
  test: {
    username: config.db.username,
    password: config.db.password,
    database: `${config.db.database}_test`, // Use a separate test database
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false,
    operatorsAliases: false,
  },
  production: {
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false,
    operatorsAliases: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false // For self-signed certs or services like Heroku
      } : false,
    },
    url: config.db.url, // For services that provide a direct DATABASE_URL
  },
};

module.exports = dbConfig;