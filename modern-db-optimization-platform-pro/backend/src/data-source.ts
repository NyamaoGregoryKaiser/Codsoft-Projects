```typescript
import { DataSource } from 'typeorm';
import ormConfig from '../ormconfig';
import logger from './shared/logger';
import { config } from './config';

export const AppDataSource = new DataSource({
  ...ormConfig,
  // Ensure that synchronize is always false in production and generally false
  // It's mainly for rapid prototyping, migrations are preferred.
  synchronize: false,
  logging: config.isDevelopment,
});

export const initializeDataSource = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Data Source has been initialized!');
      if (config.isTest) {
        // Run migrations for test environment
        await AppDataSource.runMigrations();
        logger.info('Migrations executed for test environment.');
      }
    }
  } catch (err) {
    logger.error('Error during Data Source initialization:', err);
    process.exit(1);
  }
};

export const closeDataSource = async () => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Data Source has been closed.');
    }
  } catch (err) {
    logger.error('Error during Data Source closing:', err);
  }
};
```