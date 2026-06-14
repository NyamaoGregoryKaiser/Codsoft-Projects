```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DataSourcesModule } from './data-sources/data-sources.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { ChartsModule } from './charts/charts.module';
import { LoggingModule } from './common/logging/logging.module';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DataSourcesModule,
    DashboardsModule,
    ChartsModule,
    LoggingModule, // Custom logging module
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ttl: 300, // seconds
      isGlobal: true, // Makes CacheModule available everywhere
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```