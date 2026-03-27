import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from '../config';
import { User } from '../modules/users/user.entity';
import { Project } from '../modules/projects/project.entity';
import { Task } from '../modules/tasks/task.entity';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false, // Set to true only for development or initial schema creation, use migrations for production
  logging: config.env === 'development' ? ['query', 'error'] : ['error'],
  entities: [User, Project, Task],
  migrations: [path.join(__dirname, '/migrations/*.ts')],
  subscribers: [],
});