```typescript
import 'reflect-metadata'; // Must be imported first for TypeORM
import app from './app';
import { AppDataSource } from './database/data-source';
import config from './config/config';
import logger from './utils/logger';

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected successfully.');

    // Automatically run migrations on server start
    logger.info('Running database migrations...');
    await AppDataSource.runMigrations();
    logger.info('Database migrations completed.');

    // Optional: Seed data if the database is empty or explicitly desired
    // Check if there are any users to decide whether to seed
    const userRepository = AppDataSource.getRepository('User');
    const userCount = await userRepository.count();
    if (userCount === 0) {
      logger.info('No users found. Seeding initial data...');
      // Note: In a production environment, you might want to control seeding
      // more carefully, perhaps via a separate script or a flag.
      // For this example, we'll run it if no users exist.
      // Make sure the seed script is idempotent.
      const { seed } = await import('./database/seeds/seed'); // Dynamic import
      await seed();
      logger.info('Initial data seeded.');
    } else {
      logger.info('Users already exist. Skipping seed data.');
    }

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Access API at http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error('Failed to connect to database or start server:', error);
    process.exit(1);
  }
};

startServer();
```