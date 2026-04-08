import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.APP_ENV || 'development'}` });
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env', override: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until custom logger is initialized
  });

  const configService = app.get(ConfigService);
  const appPort = configService.get<number>('APP_PORT');
  const appEnv = configService.get<string>('APP_ENV');

  // Use custom Winston logger
  app.useLogger(app.get(Logger));

  // Enable CORS
  app.enableCors({
    origin: '*', // Adjust for production: e.g., configService.get('FRONTEND_URL')
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Security middleware
  app.use(helmet());

  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not defined in DTOs
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitives based on DTO types
      },
    }),
  );

  // Swagger (OpenAPI) documentation
  if (appEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Payment Processing System API')
      .setDescription('API documentation for the Payment Processing System')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'Header' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Keep auth token even after refresh
      },
    });
  }

  await app.listen(appPort);
  Logger.log(`Application is running on: ${await app.getUrl()} in ${appEnv} mode`);
}
bootstrap();