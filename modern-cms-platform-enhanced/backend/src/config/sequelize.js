```javascript
const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  logging: (msg) => logger.debug(msg), // Log SQL queries to Winston
  dialectOptions: {
    // ssl: {
    //   require: true, // For Heroku or similar cloud DBs
    //   rejectUnauthorized: false // For self-signed certificates
    // }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
```