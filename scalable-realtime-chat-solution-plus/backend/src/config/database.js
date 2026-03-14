```javascript
/**
 * @file Manages the database connection using Sequelize.
 * @module config/database
 */

const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('../utils/logger');

const dbConfig = config.database;

const sequelize = new Sequelize(dbConfig.name, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging, // Pass a function to logger.debug for more granular logging
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle,
    },
    dialectOptions: {
        // Optional: SSL configuration for production databases like Heroku Postgres
        // ssl: {
        //     require: true,
        //     rejectUnauthorized: false // This line might be needed for some hosted databases
        // }
    },
});

/**
 * Authenticates the connection to the database.
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1); // Exit process if DB connection fails
    }
};

module.exports = {
    sequelize,
    connectDB,
};
```