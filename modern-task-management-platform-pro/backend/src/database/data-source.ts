```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config/config';
import logger from '../utils/logger';
import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false, // NEVER use synchronize: true in production! Use migrations.
  logging: config.nodeEnv === 'development',
  entities: [User, Project, Task, Comment],
  migrations: [__dirname + '/migrations/**/*.ts'],
  subscribers: [],
});

export const initializeDataSource = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected successfully!');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1); // Exit process if DB connection fails
  }
};
```