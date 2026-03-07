```javascript
const app = require('./app');
const config = require('./config');
const { sequelize } = require('./models');
const logger = require('./config/logger');
const redisClient = require('./config/redis');

let server;

// Connect to PostgreSQL and Redis
sequelize.authenticate()
  .then(() => {
    logger.info('Connected to PostgreSQL database!');
    return sequelize.sync(); // You might use migrations in production, sync is fine for dev/testing
  })
  .then(() => {
    logger.info('Database synchronized!');
    return redisClient.connect();
  })
  .then(() => {
    logger.info('Connected to Redis!');
    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port} in ${config.env} mode`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to database or redis:', err);
    process.exit(1);
  });

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