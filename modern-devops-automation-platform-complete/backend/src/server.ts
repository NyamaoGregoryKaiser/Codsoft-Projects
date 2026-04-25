```typescript
import 'reflect-metadata'; // Required for TypeORM
import dotenv from 'dotenv';
import path from 'path';
import app from './app';
import AppDataSource from './data-source';
import { logger } from './utils/logger';
import { connectRedis } from './utils/redisClient';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize TypeORM Data Source
    await AppDataSource.initialize();
    logger.info('Database connection established successfully.');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connection established successfully.');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    logger.error('Failed to connect to database or start server:', error);
    process.exit(1); // Exit with failure code
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await AppDataSource.destroy();
  logger.info('Database connection closed.');
  // Optionally, close Redis connection if it was explicitly opened
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```