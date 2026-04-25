```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';
import { User } from './entities/User';
import { Project } from './entities/Project';
import { Task } from './entities/Task';
import { Logger } from './utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Never use synchronize in production! Use migrations.
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  entities: [User, Project, Task],
  migrations: [path.join(__dirname, 'migrations/*.ts')],
  subscribers: [],
  maxQueryExecutionTime: 1000, // Log queries taking longer than 1 second
  extra: {
    max: 20, // Max number of connections in the pool
    min: 2,  // Min number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  },
});

// Custom logger for TypeORM, integrating with Winston
AppDataSource.setOptions({
  logger: {
    logQuery: (query: string, parameters?: any[]) => {
      Logger.debug(`[TypeORM Query]: ${query} -- Parameters: ${JSON.stringify(parameters)}`);
    },
    logQueryError: (error: string, query: string, parameters?: any[]) => {
      Logger.error(`[TypeORM Query Error]: ${error} -- Query: ${query} -- Parameters: ${JSON.stringify(parameters)}`);
    },
    logQuerySlow: (time: number, query: string, parameters?: any[]) => {
      Logger.warn(`[TypeORM Slow Query]: ${time}ms -- Query: ${query} -- Parameters: ${JSON.stringify(parameters)}`);
    },
    logSchemaBuild: (message: string) => {
      Logger.debug(`[TypeORM Schema Build]: ${message}`);
    },
    logMigration: (message: string) => {
      Logger.info(`[TypeORM Migration]: ${message}`);
    },
    log: (level: 'log' | 'info' | 'warn', message: any) => {
      if (level === 'log') Logger.debug(`[TypeORM]: ${message}`);
      if (level === 'info') Logger.info(`[TypeORM]: ${message}`);
      if (level === 'warn') Logger.warn(`[TypeORM]: ${message}`);
    },
  },
});

export default AppDataSource;
```