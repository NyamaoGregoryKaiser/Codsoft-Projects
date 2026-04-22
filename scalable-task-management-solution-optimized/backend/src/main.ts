import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { AppLogger } from './shared/logger/app-logger.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffers logs until a custom logger is attached
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const globalPrefix = configService.get<string>('GLOBAL_PREFIX') || 'api/v1';

  // Apply custom logger
  app.useLogger(app.get(AppLogger));

  // Security Middlewares
  app.use(helmet());
  app.enableCors({
    origin: '*', // In production, specify your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Pipes & Filters & Interceptors
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips away properties that are not defined in the DTO
    forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are sent
    transform: true, // Automatically transforms payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Allows implicit type conversion
    }
  }));
  app.useGlobalFilters(new HttpExceptionFilter(app.get(AppLogger)));
  app.useGlobalInterceptors(new LoggingInterceptor(app.get(AppLogger)));
  // CachingInterceptor will be applied selectively or globally if desired.

  // Set global prefix
  app.setGlobalPrefix(globalPrefix);

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('The API documentation for the Task Management System')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT-Auth', // This name is important for `@ApiBearerAuth('JWT-Auth')`
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  app.get(AppLogger).log(`Application is running on: ${await app.getUrl()}/${globalPrefix}`, 'NestApplication');
  app.get(AppLogger).log(`Swagger documentation available at: ${await app.getUrl()}/docs`, 'NestApplication');
}
bootstrap();