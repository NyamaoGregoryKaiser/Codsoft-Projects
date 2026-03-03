import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './src/database/entities/User';
import { Task } from './src/database/entities/Task';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_db',
  synchronize: false, // Set to false in production, use migrations
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Task],
  migrations: [path.join(__dirname, 'src', 'database', 'migrations', '*.ts')],
  subscribers: [],
  extra: {
    max: 10, // Maximum number of connections in the pool
    min: 2, // Minimum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  },
};

export const AppDataSource = new DataSource(config);

export default AppDataSource;