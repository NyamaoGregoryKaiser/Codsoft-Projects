import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Room } from '../chat/room.entity';
import { Message } from '../chat/message.entity';
import { RoomMember } from '../chat/room-member.entity';

/**
 * TypeORM configuration options for the application.
 * This configuration is used for both the NestJS TypeOrmModule and TypeORM CLI.
 */
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL, // Use DATABASE_URL from environment
  entities: [User, Room, Message, RoomMember], // Entities to be managed by TypeORM
  migrations: [__dirname + '/migrations/**/*.ts'], // Path to migration files
  synchronize: false, // In production, never use synchronize: true. Use migrations instead.
  logging: process.env.NODE_ENV === 'development', // Enable logging in development
  extra: {
    max: 10, // Max number of connections in the pool
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Enable SSL for production
  },
};

/**
 * Async TypeORM configuration for NestJS.
 * This allows injecting ConfigService to dynamically get database credentials.
 */
export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule], // Import ConfigModule to use ConfigService
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
    ...typeOrmConfig, // Spread base config
    url: configService.get<string>('DATABASE_URL'), // Override URL from ConfigService
    // Optionally, you can set other database options via ConfigService as well
    // host: configService.get<string>('DB_HOST'),
    // port: configService.get<number>('DB_PORT'),
    // username: configService.get<string>('DB_USERNAME'),
    // password: configService.get<string>('DB_PASSWORD'),
    // database: configService.get<string>('DB_DATABASE'),
  }),
};

/**
 * TypeORM CLI DataSource.
 * This is used by the `typeorm` command-line tool for migrations.
 * It needs to be a default export.
 */
export default new DataSource(typeOrmConfig);
```