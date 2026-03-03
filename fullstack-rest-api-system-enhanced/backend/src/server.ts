import app from './app';
import { AppDataSource } from './database';
import { logger } from './config/logger';
import { redisClient } from './shared/utils/cache';
import { initialSeed } from './database/seeds/initial.seed';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize Database
    await AppDataSource.initialize();
    logger.info('Database connection established successfully.');

    // Run migrations
    await AppDataSource.runMigrations();
    logger.info('Migrations executed successfully.');

    // Seed initial data (only if no users exist, or based on a specific flag)
    await initialSeed();
    logger.info('Initial data seeding completed.');

    // Initialize Redis client
    await redisClient.connect();
    logger.info('Redis client connected successfully.');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await AppDataSource.destroy();
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await AppDataSource.destroy();
  await redisClient.disconnect();
  process.exit(0);
});