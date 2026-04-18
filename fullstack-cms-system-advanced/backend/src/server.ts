import 'reflect-metadata'; // Must be imported before TypeORM
import app from './app';
import { config } from './config';
import { AppDataSource } from './data-source';
import logger from './config/logger';

async function startServer() {
  try {
    // Initialize Database Connection
    await AppDataSource.initialize();
    logger.info('Database connected successfully!');

    // Start Express Server
    const PORT = config.app.port;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.app.nodeEnv} mode`);
      logger.info(`Access Frontend at ${config.app.frontendUrl}`);
      logger.info(`Backend API accessible at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to database or start server:', error);
    process.exit(1); // Exit process with failure code
  }
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1); // Exit process with failure code
});