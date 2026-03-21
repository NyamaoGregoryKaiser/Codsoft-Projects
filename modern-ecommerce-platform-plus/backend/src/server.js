require('dotenv').config();
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const knex = require('./database/knexfile'); // Import knex configuration

const PORT = config.PORT || 5000;

async function assertDatabaseConnection() {
  logger.info('Checking database connection...');
  try {
    // Ping the database
    await knex.raw('SELECT 1+1 AS result');
    logger.info('Database connected successfully.');

    // Run migrations on server start (optional, good for dev, for prod use CI/CD or separate command)
    logger.info('Running database migrations...');
    await knex.migrate.latest();
    logger.info('Database migrations completed.');

    // Run seeds (optional, only for development or initial setup)
    if (process.env.NODE_ENV !== 'production' && process.env.RUN_SEEDS === 'true') {
      logger.info('Running database seeds...');
      await knex.seed.run();
      logger.info('Database seeds completed.');
    }

  } catch (error) {
    logger.error('Failed to connect to or migrate database:', error);
    process.exit(1); // Exit process if database connection fails
  }
}

assertDatabaseConnection()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.NODE_ENV} environment.`);
      logger.info(`Access API at http://localhost:${PORT}/api/v1`);
    });
  })
  .catch(err => {
    logger.error('Failed to start server due to database error:', err);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', reason);
  // Optional: Send error details to monitoring service
  // server.close(() => { // If you have an http server instance
  process.exit(1);
  // });
});