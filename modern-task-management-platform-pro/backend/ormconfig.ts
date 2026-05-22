```typescript
import { DataSourceOptions } from 'typeorm';
import { config } from './src/config/config';

// This file is used by the TypeORM CLI for migrations and other commands.
// It uses the same configuration as the main application.

const ormConfig: DataSourceOptions = {
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false, // NEVER use synchronize: true in production!
  logging: config.nodeEnv === 'development',
  entities: [
    __dirname + '/src/database/entities/**/*.entity.ts'
  ],
  migrations: [
    __dirname + '/src/database/migrations/**/*.ts'
  ],
  subscribers: [],
  // CLI settings for migrations
  cli: {
    migrationsDir: 'src/database/migrations',
    entitiesDir: 'src/database/entities',
  }
};

export default ormConfig;
```