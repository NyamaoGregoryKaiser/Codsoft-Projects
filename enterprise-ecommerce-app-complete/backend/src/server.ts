```typescript
import { app } from './app';
import { config } from './config';
import logger from './utils/logger';
import { connectRedis } from './utils/cache';

const PORT = config.PORT;

const startServer = async () => {
  try {
    // Connect to Redis (for caching)
    await connectRedis();
    logger.info('Connected to Redis.');

    // Start the Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.NODE_ENV} mode.`);
      logger.info(`Access API at http://localhost:${PORT}${config.API_PREFIX}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION!  Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1); // Exit with failure code
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});
```