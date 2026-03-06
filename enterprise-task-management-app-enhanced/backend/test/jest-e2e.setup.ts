import { exec } from 'child_process';
import { promisify } from 'util';
import AppDataSource from '../src/ormconfig';

const execAsync = promisify(exec);

// This setup file runs before all E2E tests.
// It ensures a clean database state for testing.
beforeAll(async () => {
  // Ensure the database is initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // Run migrations to ensure schema is up-to-date
  await AppDataSource.runMigrations();

  // Clear all data before running tests
  await AppDataSource.manager.clear(AppDataSource.manager.getRepository('Comment').target);
  await AppDataSource.manager.clear(AppDataSource.manager.getRepository('Task').target);
  await AppDataSource.manager.clear(AppDataSource.manager.getRepository('Project').target);
  await AppDataSource.manager.clear(AppDataSource.manager.getRepository('User').target);
  // Add other entities here
}, 60000); // Increase timeout for database operations

afterAll(async () => {
  // Clear data after all tests
  await AppDataSource.manager.clear(AppDataSource.manager.getRepository('Comment').target);
  await AppDataSource.manager.clear(AppDataSource.manager.getRepository('Task').target);
  await AppDataSource.manager.clear(AppDataSource.manager.getRepository('Project').target);
  await AppDataSource.manager.clear(AppDataSource.manager.getRepository('User').target);
  // Add other entities here

  // You might want to revert migrations or drop schema entirely for a clean slate
  // await AppDataSource.dropDatabase(); // Dangerous for shared test DB, use with caution
  // await AppDataSource.runMigrations({ transaction: 'all', revert: true });

  await AppDataSource.destroy();
});