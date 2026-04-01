import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

config({ path: path.resolve(__dirname, '../../.env') });

const entitiesPath = path.join(__dirname, '..', 'models', '*.entity.{ts,js}');
const migrationsPath = path.join(__dirname, '..', 'database', 'migrations', '*.{ts,js}');

const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.NODE_ENV === 'test' ? process.env.DB_TEST_NAME : process.env.DB_NAME || 'horizon_pms_db',
  synchronize: false, // Never use synchronize in production! Use migrations.
  logging: process.env.NODE_ENV === 'development',
  entities: [entitiesPath],
  migrations: [migrationsPath],
  subscribers: [],
};

export const AppDataSource = new DataSource(dbConfig);

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info(`Database connected: ${dbConfig.database}`);
    if (process.env.NODE_ENV !== 'test') { // Don't run migrations automatically in test, control via test scripts
      await AppDataSource.runMigrations();
      logger.info('Database migrations applied.');
    }
  } catch (error) {
    logger.error('Error connecting to database:', error);
    process.exit(1);
  }
};

export default AppDataSource;