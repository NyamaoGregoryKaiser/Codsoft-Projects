import { DataSource } from 'typeorm';
import { env } from './src/config/env';
import { User } from './src/entities/User';
import { Application } from './src/entities/Application';
import { Page } from './src/entities/Page';
import { PerformanceMetric } from './src/entities/PerformanceMetric';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false, // Set to true only for development, use migrations for production
  logging: true,
  entities: [User, Application, Page, PerformanceMetric],
  migrations: [__dirname + '/src/database/migrations/*.ts'],
  subscribers: [],
});

export default AppDataSource;