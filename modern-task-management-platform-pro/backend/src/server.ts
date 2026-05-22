```typescript
import 'reflect-metadata'; // Required by TypeORM
import app from './app';
import { config } from './config/config';
import { initializeDataSource } from './database/data-source';
import logger from './utils/logger';
import { initializeRedis } from './config/redis';

const startServer = async () => {
  // Initialize database connection
  await initializeDataSource();

  // Initialize Redis connection
  await initializeRedis();

  // Start the Express server
  const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
      process.exit(1); // Exit with failure code
    });
  });

  // Handle SIGTERM for graceful shutdown in Docker
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully.');
    server.close(() => {
      logger.info('Process terminated.');
    });
  });
};

startServer();
```