```typescript
import { DataSourceOptions } from 'typeorm';
import { User } from './src/users/user.entity';
import { DatabaseConnection } from './src/database-connections/database-connection.entity';
import * as dotenv from 'dotenv';
dotenv.config();

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false, // Never use synchronize in production
  logging: process.env.NODE_ENV === 'development',
  entities: [User, DatabaseConnection],
  migrations: [`${__dirname}/src/migrations/**/*.ts`],
  subscribers: [],
};

export default config;
```