import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { User } from './entities/User';
import { Role } from './entities/Role';
import { Category } from './entities/Category';
import { Tag } from './entities/Tag';
import { Content } from './entities/Content';
import { Media } from './entities/Media';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: false, // In production, this should always be false. Use migrations.
  logging: config.app.nodeEnv === 'development' ? ['query', 'error', 'schema'] : ['error'],
  entities: [User, Role, Category, Tag, Content, Media],
  migrations: [__dirname + '/database/migrations/**/*.ts'],
  subscribers: [],
  extra: {
    max: 10, // Maximum number of connections in pool
    min: 2, // Minimum number of connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  },
});