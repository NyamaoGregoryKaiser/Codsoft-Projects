import { AppDataSource } from '../data-source';
import { UserSeeder } from './UserSeeder';
import { Logger } from '../../config/winston';

const runSeeds = async () => {
  try {
    await AppDataSource.initialize();
    Logger.info('Database initialized for seeding.');

    await new UserSeeder().run(AppDataSource);
    // You can add more seeders here for Applications, Pages, etc.
    Logger.info('All seeders executed successfully.');

    await AppDataSource.destroy();
    Logger.info('Database connection closed after seeding.');
  } catch (error) {
    Logger.error('Seeding failed:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
};

runSeeds();