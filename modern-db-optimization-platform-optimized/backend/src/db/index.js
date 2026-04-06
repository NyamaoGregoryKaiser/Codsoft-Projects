const knex = require('knex');
const knexConfig = require('../../knexfile');
const logger = require('../config/logger');

// Initialize Knex with the appropriate configuration for the current environment
const db = knex(knexConfig[process.env.NODE_ENV || 'development']);

db.raw('SELECT 1')
    .then(() => {
        logger.info('Successfully connected to the PostgreSQL database for the DB Health Monitor system.');
    })
    .catch((err) => {
        logger.error('Failed to connect to the DB Health Monitor database:', err.message);
        process.exit(1); // Exit process if database connection fails
    });

module.exports = db;