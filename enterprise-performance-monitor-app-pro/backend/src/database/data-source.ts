import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { User } from '../entities/User';
import { Application } from '../entities/Application';
import { Page } from '../entities/Page';
import { PerformanceMetric } from '../entities/PerformanceMetric';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false, // NEVER USE IN PRODUCTION! Use migrations.
  logging: env.NODE_ENV === 'development',
  entities: [User, Application, Page, PerformanceMetric],
  migrations: [__dirname + '/migrations/*.ts'],
  subscribers: [],
});