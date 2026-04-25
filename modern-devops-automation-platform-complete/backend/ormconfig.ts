```typescript
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Never use synchronize in production!
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  entities: [path.join(__dirname, 'src/entities/*.ts')],
  migrations: [path.join(__dirname, 'src/migrations/*.ts')],
  subscribers: [],
  extra: {
    max: 20, // Max number of connections in the pool
    min: 2,  // Min number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  },
});

export default AppDataSource;
```