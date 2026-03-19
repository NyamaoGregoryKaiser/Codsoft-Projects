import 'reflect-metadata'; // Required for TypeORM decorators
import app from './app';
import { AppDataSource } from './database';
import { logger } from './config/logger';
import { PORT } from './config/env';

const startServer = async () => {
  try {
    // Initialize Database
    await AppDataSource.initialize();
    logger.info('Database connected successfully!');

    // Start Express Server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to database or start server:', error);
    process.exit(1);
  }
};

startServer();