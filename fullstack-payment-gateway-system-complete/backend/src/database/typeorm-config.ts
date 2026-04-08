import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { SeederOptions } from 'typeorm-extension';

dotenv.config({ path: `.env.${process.env.APP_ENV || 'development'}` });
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env', override: true });


const config: DataSourceOptions & SeederOptions = {
  type: process.env.DATABASE_TYPE as any || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'payment_system_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false, // NEVER use synchronize: true in production!
  logging: process.env.APP_ENV === 'development' ? ['query', 'error'] : ['error'],
  seeds: [__dirname + '/seeds/**/*{.ts,.js}'],
  factories: [__dirname + '/factories/**/*{.ts,.js}'],
};

export const AppDataSource = new DataSource(config);
export default config;