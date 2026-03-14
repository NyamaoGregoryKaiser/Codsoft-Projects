```javascript
const app = require('./src/app');
const config = require('./src/config');
const { connectDB } = require('./src/db');
const logger = require('./src/utils/logger');
const { initRedis } = require('./src/utils/cache');

const PORT = config.port;

const startServer = async () => {
  try {
    // Connect to PostgreSQL database
    await connectDB();
    logger.info('Database connected successfully.');

    // Initialize Redis client
    await initRedis();
    logger.info('Redis client connected successfully.');

    // Start the Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.env} mode.`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1); // Exit with a failure code
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
```