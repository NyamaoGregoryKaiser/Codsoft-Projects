```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { logger } from '../utils/logger';
import path from 'path';

// Load ormconfig.json
const ormConfig = require(path.resolve(__dirname, '../../ormconfig.json'))[0];

export const AppDataSource = new DataSource({
  ...ormConfig,
  host: process.env.DB_HOST || ormConfig.host, // Allow Docker override
  port: parseInt(process.env.DB_PORT || ormConfig.port, 10),
  username: process.env.DB_USER || ormConfig.username,
  password: process.env.DB_PASSWORD || ormConfig.password,
  database: process.env.DB_NAME || ormConfig.database,
  migrations: [path.join(__dirname, 'migrations/*.ts')],
  entities: [path.join(__dirname, '../modules/**/*.entity.ts')],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');
    await AppDataSource.runMigrations();
    logger.info('Migrations ran successfully');
  } catch (error) {
    logger.error('Error during database initialization:', error);
    process.exit(1);
  }
};
```