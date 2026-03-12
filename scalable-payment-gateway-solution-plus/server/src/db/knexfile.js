```javascript
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Load .env for knex CLI

const config = require('../config');

module.exports = {
  development: {
    client: 'pg',
    connection: config.databaseUrl,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    },
    debug: process.env.KNEX_DEBUG === 'true'
  },

  test: {
    client: 'pg',
    connection: config.testDatabaseUrl,
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    },
    debug: false // Keep test environment clean
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL, // Use DATABASE_URL directly for production
      ssl: { rejectUnauthorized: false } // Adjust based on your production DB setup
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};
```