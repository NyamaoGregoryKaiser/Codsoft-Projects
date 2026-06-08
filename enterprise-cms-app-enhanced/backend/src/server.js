const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const db = require('./models');
const { connectRedis } = require('./config/redis');
const path = require('path');
const fs = require('fs');

let server;

// Ensure upload directory exists
const uploadPath = path.join(__dirname, '../', config.uploadPath);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

db.sequelize.sync({ alter: true }) // `alter: true` will update table schema without dropping existing data (use `force: true` for development to drop/recreate)
  .then(() => {
    logger.info('Connected to PostgreSQL');
    return connectRedis();
  })
  .then(() => {
    server = app.listen(config.port, () => {
      logger.info(`Listening to requests on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
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