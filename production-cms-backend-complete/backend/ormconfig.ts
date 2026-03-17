import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'cmsdb',
  synchronize: false, // Never use synchronize in production!
  logging: ['query', 'error'],
  entities: [path.join(__dirname, 'src/entities/**/*.ts')],
  migrations: [path.join(__dirname, 'src/migrations/**/*.ts')],
  subscribers: [],
};

export default config;