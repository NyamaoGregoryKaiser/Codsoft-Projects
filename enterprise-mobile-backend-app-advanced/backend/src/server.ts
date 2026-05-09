import app from './app';
import config from './config/env';
import logger from './config/logger';
import prisma from './config/database';
import { redisClient } from './middleware/cache.middleware';

let server: any;

// Connect to database and start server
prisma.$connect()
  .then(() => {
    logger.info('Connected to PostgreSQL database');
    server = app.listen(config.PORT, () => {
      logger.info(`Server listening on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });
  })
  .catch((err) => {
    logger.error('Database connection failed', err);
    process.exit(1);
  });

const exitHandler = async () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      prisma.$disconnect().then(() => logger.info('Disconnected from PostgreSQL')).catch(e => logger.error('Prisma disconnect failed', e));
      if (redisClient.isReady) {
        redisClient.disconnect().then(() => logger.info('Disconnected from Redis')).catch(e => logger.error('Redis disconnect failed', e));
      }
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: Error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});