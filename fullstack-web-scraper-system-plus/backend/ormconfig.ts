import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables based on the current environment
const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: path.resolve(process.cwd(), envPath) });

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'scraperuser',
  password: process.env.DB_PASSWORD || 'scraperpassword',
  database: process.env.DB_NAME || 'web_scraper_db',
  synchronize: false, // Set to false in production. Use migrations.
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, 'src/entities/**/*.ts')],
  migrations: [path.join(__dirname, 'src/migrations/**/*.ts')],
  subscribers: [path.join(__dirname, 'src/subscribers/**/*.ts')],
  extra: {
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // For production with SSL
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);

export default dataSourceOptions; // Export for TypeORM CLI