import app from './app';
import { env } from '@config/env';
import { logger } from '@utils/logger';
import { prisma } from '@models/prisma';
import { redisClient } from '@config/redis';

let server: any;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');

    await redisClient.connect();
    logger.info('Connected to Redis client');

    server = app.listen(env.port, () => {
      logger.info(`Server listening on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error('Failed to connect to database or start server', error);
    process.exit(1);
  }
};

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: Error) => {
  logger.error('Unhandled error:', error);
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

startServer();