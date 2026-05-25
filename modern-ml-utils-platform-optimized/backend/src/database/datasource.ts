import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from '../config';
import { User } from '../modules/users/entities/User';
import { Dataset } from '../modules/datasets/entities/Dataset';
import { InitialMigration1700000000000 } from './migrations/1700000000000-InitialMigration';

const AppDataSource = new DataSource({
  type: config.database.type as any, // TypeORM type expects specific string, 'postgres' is fine.
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false, // Set to false in production to prevent data loss
  logging: config.env === 'development',
  entities: [User, Dataset],
  migrations: [InitialMigration1700000000000],
  subscribers: [],
  ssl: config.env === 'production' // Use SSL in production if necessary
    ? { rejectUnauthorized: false } // Adjust based on your cloud provider's SSL requirements
    : false,
});

export default AppDataSource;