const config = require('../config');

// knex doesn't load dotenv automatically for knexfile, so manually load if needed for `knex` commands
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
}

const knexConfig = {
  development: {
    client: 'pg',
    connection: config.DATABASE_URL || process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || 'postgresql://user:password@localhost:5433/ecommerce_test_db', // Use a separate test DB
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  production: {
    client: 'pg',
    connection: config.DATABASE_URL || process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

module.exports = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);