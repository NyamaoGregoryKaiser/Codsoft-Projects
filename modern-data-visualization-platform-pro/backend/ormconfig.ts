// This file is used by TypeORM CLI for migrations and schema synchronization.
// For application runtime, src/db/data-source.ts is used.

import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // Should be false in production, use migrations instead
  logging: true,
  entities: [path.join(__dirname, 'src/models/**/*.ts')], // Where TypeORM finds your entities
  migrations: [path.join(__dirname, 'src/db/migrations/**/*.ts')], // Where TypeORM finds your migrations
  subscribers: [],
};

export const AppDataSource = new DataSource(config);

// This default export is important for TypeORM CLI
export default config;