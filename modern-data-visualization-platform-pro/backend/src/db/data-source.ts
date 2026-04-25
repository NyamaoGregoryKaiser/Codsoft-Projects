import { DataSource } from 'typeorm';
import { User } from '@models/User';
import { Dataset } from '@models/Dataset';
import { Dashboard } from '@models/Dashboard';
import { Visualization } from '@models/Visualization';
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, NODE_ENV } from '@config/env';
import logger from '@config/logger';

/**
 * TypeORM data source configuration for the application.
 * This is used for runtime database interaction.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: NODE_ENV === 'development' ? false : false, // Do NOT use synchronize in production! Use migrations.
  logging: NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  entities: [User, Dataset, Dashboard, Visualization],
  migrations: [`${__dirname}/migrations/*.ts`],
  subscribers: [],
});