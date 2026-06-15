import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectRedis } from './services/cache.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let server: any;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');

    await connectRedis();

    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API Docs: http://localhost:${config.port}${config.apiPrefix}/docs (if Swagger enabled)`);
    });
  } catch (error) {
    logger.error('Failed to connect to database or start server:', error);
    process.exit(1);
  }
};

const exitHandler = async () => {
  if (server) {
    server.close(async () => {
      logger.info('Server closed');
      await prisma.$disconnect();
      logger.info('Prisma client disconnected');
      process.exit(1);
    });
  } else {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION or UNHANDLED REJECTION:', error);
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
```