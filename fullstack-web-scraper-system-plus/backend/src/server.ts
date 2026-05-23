import 'reflect-metadata'; // Must be imported before TypeORM
import app from './app';
import { AppDataSource } from './ormconfig';
import { logger } from './utils/logger';
import { startScheduler } from './utils/scheduler';
import { redisClient } from './config/redis.config';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Initialize Database
    await AppDataSource.initialize();
    logger.info('Database connected successfully!');

    // Initialize Redis
    await redisClient.connect();
    logger.info('Redis connected successfully!');

    // Start Express Server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
    });

    // Start Scrape Job Scheduler
    startScheduler();
    logger.info('Scrape job scheduler started.');

  } catch (error) {
    logger.error('Failed to connect to database or start server:', error);
    process.exit(1);
  }
}

bootstrap();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await AppDataSource.destroy();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await AppDataSource.destroy();
  await redisClient.quit();
  process.exit(0);
});