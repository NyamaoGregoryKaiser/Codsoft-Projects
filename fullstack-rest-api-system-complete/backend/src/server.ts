import App from './app';
import { initializeDatabase } from './config/database';
import logger from './utils/logger';

const startServer = async () => {
  try {
    // Initialize database connection and run migrations
    await initializeDatabase();

    // Create and start the Express app
    const app = new App();
    app.listen();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();