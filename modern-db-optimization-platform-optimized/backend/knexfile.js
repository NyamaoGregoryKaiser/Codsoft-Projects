const config = require('./src/config');

module.exports = {
  development: {
    client: config.database.client,
    connection: config.database.connection,
    pool: config.database.pool,
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    useNullAsDefault: true,
  },

  staging: {
    client: config.database.client,
    connection: config.database.connection,
    pool: config.database.pool,
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    useNullAsDefault: true,
  },

  production: {
    client: config.database.client,
    connection: config.database.connection,
    pool: config.database.pool,
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    useNullAsDefault: true,
  },

  test: {
    client: 'sqlite3', // Using SQLite for faster tests
    connection: {
      filename: ':memory:', // In-memory database
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    useNullAsDefault: true,
  },
};