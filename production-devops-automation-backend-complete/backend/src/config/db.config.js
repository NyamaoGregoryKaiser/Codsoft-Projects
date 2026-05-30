```javascript
const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('./logger.config');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: (msg) => logger.debug(msg), // Log SQL queries at debug level
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      freezeTableName: true, // Prevent Sequelize from pluralizing table names
      underscored: true,    // Use snake_case for column names
    },
    dialectOptions: {
      // ssl: {
      //   require: true, // If using SSL, e.g., on Heroku or other cloud dbs
      //   rejectUnauthorized: false // For self-signed certs or development
      // }
    }
  }
);

module.exports = sequelize;
```