import app from './app';
import { connectDB } from './config/database';
import logger from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to the database first
connectDB().then(() => {
  // Start the server only after successful database connection
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    logger.error('UNHANDLED REJECTION! Shutting down...');
    logger.error(err.name, err.message, err.stack);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(err.name, err.message, err.stack);
    server.close(() => {
      process.exit(1);
    });
  });
}).catch((error) => {
  logger.error('Failed to connect to database, exiting:', error);
  process.exit(1);
});