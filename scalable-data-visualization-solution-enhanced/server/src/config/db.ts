```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { User } from '../models/User';
import { Dataset } from '../models/Dataset';
import { Dashboard } from '../models/Dashboard';
import { Visualization } from '../models/Visualization';
import { InitialMigration1715694000000 } from '../migrations/1715694000000_initial_migration'; // Example migration

const dbConfig = {
  type: 'postgres' as const,
  url: config.DATABASE_URL,
  synchronize: false, // Never true in production! Use migrations.
  logging: config.NODE_ENV === 'development',
  entities: [User, Dataset, Dashboard, Visualization],
  migrations: [InitialMigration1715694000000], // Register your migrations here
  subscribers: [],
};

export const AppDataSource = new DataSource(dbConfig);

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully!');

    // Run migrations automatically in development/test, or via CLI in production
    if (config.NODE_ENV !== 'production') {
      await AppDataSource.runMigrations();
      console.log('Migrations applied successfully!');
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};
```