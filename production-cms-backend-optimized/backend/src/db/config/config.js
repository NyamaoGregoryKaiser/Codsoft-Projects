```javascript
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') }); // Load .env from root

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log, // Enable logging for development
    seederStorage: 'sequelize',
    seederStorageTableName: 'SequelizeSeedMeta',
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || `${process.env.DB_NAME}_test`,
    host: process.env.TEST_DB_HOST || process.env.DB_HOST,
    port: process.env.TEST_DB_PORT || process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Disable logging for tests
    seederStorage: 'sequelize',
    seederStorageTableName: 'SequelizeSeedMeta',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Disable logging for production
    seederStorage: 'sequelize',
    seederStorageTableName: 'SequelizeSeedMeta',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false // Adjust based on your SSL certificate setup
      } : false
    }
  }
};
```