import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from './src/entities/User';
import { RefreshToken } from './src/entities/RefreshToken';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false, // Set to false in production! Use migrations.
  logging: process.env.NODE_ENV === 'development',
  entities: [User, RefreshToken],
  migrations: [__dirname + '/src/migrations/**/*.ts'],
  migrationsTableName: 'migrations',
});

export default AppDataSource;