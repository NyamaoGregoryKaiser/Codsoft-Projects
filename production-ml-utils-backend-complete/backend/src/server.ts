```typescript
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeDatabase } from './database';
import fs from 'fs';
import path from 'path';

// Create uploads directory if it doesn't exist
const uploadsDir = config.storagePath;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory at: ${uploadsDir}`);
}

// Initialize Database and then start the server
initializeDatabase().then(() => {
  const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  // Handle unhandled rejections (e.g., DB connection errors after initial setup)
  process.on('unhandledRejection', (err: Error) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions (synchronous errors)
  process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
});
```