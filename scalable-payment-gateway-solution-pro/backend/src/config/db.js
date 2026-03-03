const knex = require('knex');
const knexfile = require('../../knexfile');
const logger = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const configOptions = knexfile[env];

const db = knex(configOptions);

const connectDB = async () => {
  try {
    await db.raw('SELECT 1+1 AS result');
    logger.info('PostgreSQL connected...');
  } catch (err) {
    logger.error('PostgreSQL connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { db, connectDB };