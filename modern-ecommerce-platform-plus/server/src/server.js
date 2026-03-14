```javascript
// server/src/server.js
const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const prisma = require('./config/db'); // Ensure Prisma client is initialized

let server;

// Connect to database and start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');

    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Database connection failed or server failed to start:', error);
    process.exit(1); // Exit with failure
  }
};

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error('Unhandled error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

```