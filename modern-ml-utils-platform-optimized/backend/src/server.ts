import app from './app';
import config from './config';
import logger from './config/logger';
import AppDataSource from './database/datasource';

let server: any;

// Connect to Database
AppDataSource.initialize()
  .then(() => {
    logger.info('Connected to PostgreSQL database');
    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port} in ${config.env} mode`);
    });
  })
  .catch((error) => {
    logger.error('Database connection error:', error);
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

const unexpectedErrorHandler = (error: Error) => {
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