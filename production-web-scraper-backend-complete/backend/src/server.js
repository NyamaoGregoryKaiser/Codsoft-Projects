const app = require('./app');
const { port, env } = require('./config');
const logger = require('./utils/logger');
const sequelize = require('./db/models'); // This will automatically load models and connect
const { connectRedis } = require('./utils/redisClient');
const { setupWorker } = require('./workers/scrapeWorker');
const { queue: scrapeQueue } = require('./services/jobScheduler.service');

let server;

// Connect to PostgreSQL and sync models
sequelize.authenticate()
  .then(() => {
    logger.info('Connected to PostgreSQL database!');
    return sequelize.sync(); // You might use migrations in production, but for dev sync is fine
  })
  .then(() => {
    logger.info('Database models synchronized.');
    // Connect to Redis
    return connectRedis();
  })
  .then(() => {
    logger.info('Connected to Redis!');
    // Set up BullMQ worker
    setupWorker();
    logger.info('BullMQ worker started.');
    // Start the Express server
    server = app.listen(port, () => {
      logger.info(`Server running on port ${port} in ${env} mode`);
      logger.info(`Access API at http://localhost:${port}/api`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to database or start server:', error.message);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      scrapeQueue.close().then(() => logger.info('BullMQ queue closed.'));
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error('Unhandled error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      scrapeQueue.close().then(() => logger.info('BullMQ queue closed.'));
    });
  }
});