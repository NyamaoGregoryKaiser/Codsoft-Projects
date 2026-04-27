import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import configuration from './config/configuration';
import * as Joi from 'joi';
import { typeOrmConfigAsync } from './database/typeorm-config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WinstonLoggerModule } from './common/logger/winston-logger.module';
import { ThrottlerBehindProxyGuard } from './common/throttler/throttler-behind-proxy.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';

@Module({
  imports: [
    // --- Configuration Module ---
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        SESSION_SECRET: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),

    // --- Database Module ---
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),

    // --- Rate Limiting Module ---
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('THROTTLE_TTL', 60), // Time-to-live for requests (e.g., 60 seconds)
        limit: config.get<number>('THROTTLE_LIMIT', 10), // Max requests per TTL
      }),
    }),

    // --- Logging Module ---
    WinstonLoggerModule,

    // --- Application Modules ---
    AuthModule,
    UsersModule,
    ChatModule,
  ],
  controllers: [],
  providers: [
    // --- Global Providers ---
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard, // Global rate limiting guard
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter, // Global exception handler
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // Global request/response logger
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Example of applying a functional middleware globally or to specific routes
    consumer
      .apply(LoggerMiddleware) // Simple functional middleware for all routes
      .forRoutes('*'); // Apply to all routes
  }
}