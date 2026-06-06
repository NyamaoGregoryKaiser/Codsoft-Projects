```javascript
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const prisma = require('./database/prisma');
const redisClient = require('./utils/redis');

let server;

// Function to gracefully close connections
const exitHandler = async () => {
  if (server) {
    server.close(async () => {
      logger.info('Server closed');
      await prisma.$disconnect();
      await redisClient.disconnect();
      process.exit(1);
    });
  } else {
    await prisma.$disconnect();
    await redisClient.disconnect();
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    exitHandler();
  }
});

async function startServer() {
  try {
    // Connect to Prisma DB
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');

    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis cache');

    // Start the Express server
    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```