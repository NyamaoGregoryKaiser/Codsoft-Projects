```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Global Prefix for API
  app.setGlobalPrefix('api');

  // Security Middlewares
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || '*', // Adjust for production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: configService.get<number>('API_RATE_LIMIT_TTL') * 1000 || 60 * 1000, // 1 minute
      max: configService.get<number>('API_RATE_LIMIT_MAX') || 100, // 100 requests per 1 minute
      message: 'Too many requests from this IP, please try again after a minute',
    }),
  );

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties that are not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are provided
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // Global Exception Filter for consistent error responses
  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));

  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
```