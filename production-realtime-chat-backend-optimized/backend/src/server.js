```javascript
const http = require('http');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const sequelize = require('./config/sequelize');
const { connectRedis } = require('./config/redis');
const initializeSocketIO = require('./sockets/socketHandlers');

const server = http.createServer(app);
const io = initializeSocketIO(server);

let shuttingDown = false;

const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL database!');

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis!');

    server.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (err) {
    logger.error('Failed to connect to database or Redis:', err);
    process.exit(1);
  }
};

const exitHandler = () => {
  if (server && !shuttingDown) {
    shuttingDown = true;
    logger.info('Closing HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed.');
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
    exitHandler();
  }
});

startServer();

module.exports = {
  server, // Export for testing
  io,
  sequelize, // Export for testing
};
```