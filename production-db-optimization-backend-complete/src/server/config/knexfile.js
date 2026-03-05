require('dotenv').config({ path: '../../.env' }); // Load .env from root

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'dbtune_user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'dbtune_dev',
    },
    migrations: {
      directory: '../db/migrations',
    },
    seeds: {
      directory: '../db/seeds',
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  test: {
    client: 'pg',
    connection: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5433, // Use a different port for test DB
      user: process.env.TEST_DB_USER || 'dbtune_test_user',
      password: process.env.TEST_DB_PASSWORD || 'test_password',
      database: process.env.TEST_DB_NAME || 'dbtune_test',
    },
    migrations: {
      directory: '../db/migrations',
    },
    seeds: {
      directory: '../db/seeds',
    },
    pool: {
      min: 1,
      max: 5
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }, // Adjust for production SSL
    },
    migrations: {
      directory: '../db/migrations',
    },
    seeds: {
      directory: '../db/seeds',
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};