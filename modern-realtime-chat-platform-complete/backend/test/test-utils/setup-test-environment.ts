import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { WinstonLoggerModule } from '../../src/common/logger/winston-logger.module';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from '../../src/config/configuration';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { ChatModule } from '../../src/chat/chat.module';
import { typeOrmConfigAsync } from '../../src/database/typeorm-config';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { WinstonLogger } from '../../src/common/logger/winston.logger';

/**
 * Helper function to set up a NestJS testing module and application for integration/E2E tests.
 * This ensures consistent environment setup across tests, especially database and config.
 */
export async function setupTestEnvironment() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [configuration],
        validationSchema: Joi.object({
          NODE_ENV: Joi.string().valid('development', 'production', 'test').default('test'),
          PORT: Joi.number().default(3000),
          DATABASE_URL: Joi.string().required(),
          JWT_SECRET: Joi.string().required(),
          JWT_EXPIRES_IN: Joi.string().default('1h'),
          REDIS_HOST: Joi.string().required(),
          REDIS_PORT: Joi.number().default(6379),
          SESSION_SECRET: Joi.string().required(),
          FRONTEND_URL: Joi.string().required(),
        }),
        envFilePath: '.env.test', // Use a dedicated test .env file
      }),
      TypeOrmModule.forRootAsync(typeOrmConfigAsync), // Use async config
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), // Disable/increase throttling for tests
      WinstonLoggerModule, // Ensure logger is available
      AuthModule,
      UsersModule,
      ChatModule,
    ],
  }).compile();

  const testingApp = moduleFixture.createNestApplication();

  // Apply global pipes and filters as in main.ts
  testingApp.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  testingApp.useGlobalFilters(new AllExceptionsFilter(testingApp.get(WinstonLogger)));

  // Note: For integration/e2e tests, you might mock Redis entirely or use a real in-memory Redis.
  // Session setup is omitted here for simplicity, focusing on core auth and chat.
  // For a full E2E test, you'd integrate session as well.

  await testingApp.listen(0); // Use a random available port

  return { moduleFixture, testingApp };
}
```