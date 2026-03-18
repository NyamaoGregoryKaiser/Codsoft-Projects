```javascript
const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('./logger');

const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  logging: (msg) => logger.debug(msg), // Use logger for Sequelize logs
  dialectOptions: {
    // ssl: {
    //   require: true,
    //   rejectUnauthorized: false, // For self-signed certs in dev/test
    // },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
```