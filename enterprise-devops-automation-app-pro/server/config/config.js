const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

require('./env'); // Ensure environment variables are loaded

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  logger.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: (msg) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(msg); // Only log SQL queries in development mode
    }
  },
  dialectOptions: {
    // SSL options for production deployments like Heroku, Render, etc.
    // For local development, this might not be needed or should be conditionally applied.
    // ssl: {
    //   require: process.env.NODE_ENV === 'production',
    //   rejectUnauthorized: false // Required for some cloud providers
    // }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = {
  sequelize,
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres'
  },
  test: {
    url: process.env.DATABASE_URL.replace(/(\w+)$/, '$1_test'), // Use a separate test database
    dialect: 'postgres',
    logging: false // Disable logging during tests
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};