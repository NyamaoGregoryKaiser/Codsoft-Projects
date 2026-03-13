```typescript
import app from './app';
import { config } from './config';
import logger from './shared/logger';
import { initializeDataSource, closeDataSource } from './data-source';
import { connectRedis, disconnectRedis } from './shared/redis-client';

const startServer = async () => {
  try {
    // Initialize Database (TypeORM)
    await initializeDataSource();

    // Connect to Redis
    await connectRedis();

    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await closeDataSource();
        await disconnectRedis();
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Application might be in an inconsistent state, exit gracefully
      server.close(async () => {
        await closeDataSource();
        await disconnectRedis();
        process.exit(1);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      // Application is in an unknown bad state, exit immediately
      server.close(async () => {
        await closeDataSource();
        await disconnectRedis();
        process.exit(1);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```