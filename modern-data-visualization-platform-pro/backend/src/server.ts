import 'reflect-metadata'; // Must be imported before TypeORM initialization
import app from './app';
import { AppDataSource } from './db/data-source';
import { PORT } from '@config/env';
import logger from '@config/logger';

/**
 * Main application entry point.
 * Initializes the database connection and starts the Express server.
 */
const startServer = async () => {
  try {
    // Initialize Database
    await AppDataSource.initialize();
    logger.info('Database connection established successfully.');

    // Start Express Server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Access backend at http://localhost:${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error(`Unhandled Rejection: ${err.message}`, err);
      server.close(() => process.exit(1)); // Exit process
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error(`Uncaught Exception: ${err.message}`, err);
      server.close(() => process.exit(1)); // Exit process
    });

  } catch (error) {
    logger.error('Failed to connect to database or start server:', error);
    process.exit(1); // Exit process with failure code
  }
};

startServer();