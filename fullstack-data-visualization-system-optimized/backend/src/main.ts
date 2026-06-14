```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips away properties not defined in DTOs
    forbidNonWhitelisted: true, // Throws error for non-whitelisted properties
    transform: true, // Automatically transforms payloads to DTO instances
  }));

  // Security Middlewares
  app.use(helmet()); // Sets various HTTP headers for security
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'), // Configure allowed origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(compression()); // Gzip compression for responses

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    }),
  );

  // API Documentation (Swagger)
  const config = new DocumentBuilder()
    .setTitle('Data Visualization API')
    .setDescription('API for managing users, data sources, dashboards, and charts.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'accessToken',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keeps auth token even after refresh
    }
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Swagger Docs available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();
```