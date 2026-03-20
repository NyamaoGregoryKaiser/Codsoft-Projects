const app = require('./app');
const config = require('@config');
const logger = require('@utils/logger');
const prisma = require('@config/db'); // Ensure Prisma client is initialized

const port = config.port;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connection established successfully.');

    app.listen(port, () => {
      logger.info(`Server running in ${config.env} mode on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to connect to the database or start server:', error);
    process.exit(1); // Exit with a failure code
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, err);
  // Close server & exit process
  // server.close(() => process.exit(1)); // If using http.createServer directly
  process.exit(1); // For Express app, direct exit is fine after logging
});

// Handle uncaught exceptions
process.on('uncaughtException', (err, origin) => {
  logger.error(`Uncaught Exception: ${err.message}`, err, { origin });
  process.exit(1);
});