```javascript
const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
    config.database.database,
    config.database.username,
    config.database.password,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: config.database.dialect,
        logging: (msg) => logger.debug(msg), // Log SQL queries at debug level
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            // For production, if using SSL with PostgreSQL
            // ssl: {
            //     require: true,
            //     rejectUnauthorized: false // Adjust based on your SSL certificate setup
            // }
        }
    }
);

module.exports = sequelize;
```