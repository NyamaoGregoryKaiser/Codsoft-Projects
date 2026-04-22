import { Module, CacheModule, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import * as redisStore from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

import { AppLoggerModule } from './shared/logger/app-logger.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { TagsModule } from './tags/tags.module';
import { AppDataSource } from '../ormconfig'; // Import the DataSource configuration

@Global() // Make ConfigService available globally
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available throughout the application
      envFilePath: `.env`, // Load .env from project root
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity.{ts,js}'],
        migrations: [__dirname + '/shared/migrations/*.{ts,js}'],
        synchronize: false, // NEVER use true in production, use migrations!
        logging: true,
      }),
      dataSourceFactory: async (options) => {
        // This is necessary for TypeORM CLI to work correctly with NestJS config
        const dataSource = AppDataSource;
        await dataSource.initialize();
        return dataSource;
      },
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true, // Make cache manager available globally
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        ttl: configService.get<number>('REDIS_TTL'), // seconds
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('THROTTLER_TTL') || 60,
        limit: configService.get<number>('THROTTLER_LIMIT') || 100,
        storage: new ThrottlerStorageRedisService({
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        }),
      }),
    }),
    AppLoggerModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    TagsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}