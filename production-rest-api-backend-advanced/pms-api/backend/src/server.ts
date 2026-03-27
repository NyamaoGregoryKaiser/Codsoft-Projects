import 'reflect-metadata'; // Required for TypeORM
import app from './app';
import config from './config';
import { AppDataSource } from './db/data-source';
import logger from './config/logger';

const PORT = config.port;

AppDataSource.initialize()
  .then(async () => {
    logger.info('Database connected successfully');
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Swagger docs available at /api-docs`);
    });
  })
  .catch((error) => {
    logger.error('Database connection error:', error);
    process.exit(1);
  });