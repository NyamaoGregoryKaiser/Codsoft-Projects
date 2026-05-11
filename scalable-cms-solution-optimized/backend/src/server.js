require('dotenv').config(); // Load environment variables from .env file

const app = require('./app');
const sequelize = require('./models').sequelize;
const logger = require('./utils/logger');
const config = require('./config/config').development; // Or 'production' based on NODE_ENV

const PORT = process.env.PORT || 5000;

/**
 * Connects to the database and starts the server.
 * Handles database synchronization and error logging.
 */
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Apply migrations if not in production and not explicitly disabled
    if (process.env.NODE_ENV !== 'production' || process.env.APPLY_MIGRATIONS === 'true') {
      logger.info('Applying database migrations...');
      await sequelize.sync({ alter: true }); // Use alter: true for safe schema updates, or false for no sync
      logger.info('Database synchronized (migrations applied if any changes).');
    } else {
      logger.info('Skipping database synchronization (migrations not automatically applied in production by default).');
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database or start the server:', error);
    process.exit(1); // Exit with a non-zero code to indicate an error
  }
};

startServer();

// Handle graceful shutdown
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
```