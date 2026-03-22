```javascript
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/middlewares/logger');
const prisma = require('./src/db/prisma'); // Ensure Prisma client is initialized
const redisClient = require('./src/utils/redisClient'); // Ensure Redis client is initialized

let server;

// Connect to database and start server
prisma.$connect()
  .then(() => {
    logger.info('Connected to PostgreSQL database');
    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port} (${config.env})`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      redisClient.disconnect();
      prisma.$disconnect();
      process.exit(1);
    });
  } else {
    redisClient.disconnect();
    prisma.$disconnect();
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
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