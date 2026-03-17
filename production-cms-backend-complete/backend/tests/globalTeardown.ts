import { AppDataSource } from '../src/data-source';
import { logger } from '../src/config/logger';

module.exports = async () => {
  if (AppDataSource.isInitialized) {
    logger.info('Global teardown: Destroying database connection.');
    await AppDataSource.destroy();
  }
};