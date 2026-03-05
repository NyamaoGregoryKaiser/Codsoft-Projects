require('dotenv').config(); // Load environment variables
const app = require('./app');
const logger = require('./utils/logger');
const knex = require('./db/knex');

const PORT = process.env.PORT || 5000;

// Test DB connection on startup
knex.raw('SELECT 1')
  .then(() => {
    logger.info('Successfully connected to DBTune\'s database.');
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to DBTune\'s database on startup:', err);
    process.exit(1); // Exit if DB connection fails
  });

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // It's good practice to exit the process after an uncaught exception
  process.exit(1);
});