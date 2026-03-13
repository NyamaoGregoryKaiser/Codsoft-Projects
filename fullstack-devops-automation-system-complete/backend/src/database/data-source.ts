```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from '../config/config';
import { User } from './entities/User';
import { Category } from './entities/Category';
import { Product } from './entities/Product';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  synchronize: false, // Set to true for development, false for production with migrations
  logging: ['query', 'error'], // Log queries and errors
  entities: [User, Category, Product],
  migrations: [__dirname + '/migrations/**/*.ts'],
  subscribers: [],
  extra: {
    max: 20, // Max number of connections in pool
    min: 5,  // Min number of connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  },
});
```