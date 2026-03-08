```javascript
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const db = require('./data-access/db');

const startServer = async () => {
  try {
    // Attempt to connect to the database
    await db.raw('SELECT 1');
    logger.info('Connected to PostgreSQL database');

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Failed to connect to database or start server:', error.message);
    process.exit(1); // Exit with failure code
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message, err);
  // Optionally, close server and exit process gracefully
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message, err);
  // Optionally, close server and exit process gracefully
  process.exit(1);
});
```