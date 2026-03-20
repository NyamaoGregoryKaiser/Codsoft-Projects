import AppDataSource from '../ormconfig';
import logger from '../utils/logger';

export const connectDB = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connected successfully!');
    } else {
      logger.info('Database already initialized.');
    }
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

export const getDbDataSource = () => AppDataSource;