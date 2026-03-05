const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: (msg) => logger.debug(msg), // Log SQL queries at debug level
    dialectOptions: {
      // SSL options if connecting to a cloud database requiring SSL
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false // For self-signed certificates or development
      // }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    }
  }
);

module.exports = sequelize;