```typescript
import "reflect-metadata"; // Required for TypeORM decorators
import app from "./app";
import { AppDataSource } from "./database/data-source";
import config from "./config";
import logger from "./config/logger";
import { connectRedis } from "./services/cache.service";
import { initializeQueue } from "./services/queue.service";

const PORT = config.PORT;

const startServer = async () => {
  try {
    // Initialize Database
    await AppDataSource.initialize();
    logger.info("Database connection established successfully.");

    // Connect to Redis
    await connectRedis();
    logger.info("Redis connection established successfully.");

    // Initialize Queue (e.g., for webhooks)
    initializeQueue();
    logger.info("Queue initialized successfully.");

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.NODE_ENV} mode.`);
    });
  } catch (error) {
    logger.error("Failed to connect to database or start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Application specific logging, throwing an error, or other logic here
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});
```