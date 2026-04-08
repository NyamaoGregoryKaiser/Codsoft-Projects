import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MerchantsModule } from './merchants/merchants.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ReportingModule } from './reporting/reporting.module';
import { LoggerModule } from './common/logger/logger.module';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-yet';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { User } from './database/entities/user.entity';
import { Merchant } from './database/entities/merchant.entity';
import { PaymentMethod } from './database/entities/payment-method.entity';
import { Transaction } from './database/entities/transaction.entity';
import { WebhookSubscription } from './database/entities/webhook-subscription.entity';
import { WebhookAttempt } from './database/entities/webhook-attempt.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.APP_ENV || 'development'}`, '.env.local', '.env'],
      validationSchema: Joi.object({
        APP_PORT: Joi.number().default(3000),
        APP_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

        DATABASE_TYPE: Joi.string().required(),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().required(),
        DATABASE_USERNAME: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),

        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.string().required(),

        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),

        LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
        LOG_DIR: Joi.string().default('logs'),
        LOG_MAX_FILES: Joi.string().default('7d'),

        PAYMENT_GATEWAY_API_KEY: Joi.string().required(),
        PAYMENT_GATEWAY_SECRET: Joi.string().required(),
        WEBHOOK_SIGNING_SECRET: Joi.string().required(),

        THROTTLER_TTL: Joi.number().default(60),
        THROTTLER_LIMIT: Joi.number().default(10),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.get<any>('DATABASE_TYPE'),
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USERNAME'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        entities: [User, Merchant, PaymentMethod, Transaction, WebhookSubscription, WebhookAttempt],
        synchronize: false, // Set to true only for initial development, never in production
        logging: config.get<string>('APP_ENV') === 'development' ? ['query', 'error'] : ['error'],
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>('REDIS_HOST'),
        port: config.get<number>('REDIS_PORT'),
        ttl: 300 * 1000, // 5 minutes default cache TTL
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([
        {
          ttl: config.get<number>('THROTTLER_TTL'),
          limit: config.get<number>('THROTTLER_LIMIT'),
        },
      ]),
    }),
    LoggerModule,
    AuthModule,
    UsersModule,
    MerchantsModule,
    PaymentMethodsModule,
    TransactionsModule,
    WebhooksModule,
    ReportingModule,
  ],
  providers: [
    Logger, // Provide the global logger
    {
      provide: APP_GUARD, // Apply ThrottlerGuard globally
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}