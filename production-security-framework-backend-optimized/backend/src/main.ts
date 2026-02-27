```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until Winston is ready
  });

  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);

  // Use Winston as the logger
  app.useLogger(loggerService);

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter(loggerService));

  // Security Middlewares
  app.use(helmet()); // Apply security headers
  app.use(cookieParser()); // Parse cookies from incoming requests

  // CORS Configuration
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin, // Allow requests only from the frontend URL
    credentials: true, // Allow cookies to be sent with requests
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not defined in DTOs
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Secure Task Management API')
    .setDescription('API documentation for the Secure Task Management System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'accessToken', // This name is used to identify the security scheme in Swagger UI
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // '/api' is the endpoint for Swagger UI

  // Rate Limiting (applied globally for example, can be per-controller/route)
  // Note: For a real production app, consider a reverse proxy (Nginx, API Gateway) for rate limiting.
  // Using express-rate-limit directly here for demonstration.
  // const rateLimitMiddleware = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100, // Limit each IP to 100 requests per 15 minutes
  //   message: 'Too many requests from this IP, please try again after 15 minutes',
  // });
  // app.use(rateLimitMiddleware);
  // Specific rate limiting will be applied via `express-rate-limit` to critical routes in controllers.

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  loggerService.log(`Application is running on: ${await app.getUrl()}`);
  loggerService.log(`Swagger docs available at: ${await app.getUrl()}/api`);
}
bootstrap();
```