import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import Redis from 'ioredis';
import { WinstonLogger } from './common/logger/winston.logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until WinstonLogger is ready
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');
  const redisHost = configService.get<string>('REDIS_HOST');
  const redisPort = configService.get<number>('REDIS_PORT');
  const sessionSecret = configService.get<string>('SESSION_SECRET');

  // --- Global Configuration ---
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips away properties that are not defined in the DTO
    forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are sent
    transform: true, // Automatically transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Allows implicit type conversion (e.g., string to number)
    },
  }));

  // Use Winston for logging
  app.useLogger(app.get(WinstonLogger));
  app.useGlobalFilters(new AllExceptionsFilter(app.get(WinstonLogger)));

  // --- CORS Configuration ---
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'), // Allow specific frontend URL
    credentials: true, // Allow cookies to be sent
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // --- Session Management (Redis for Caching/Session Store) ---
  const RedisStore = connectRedis(session);
  const redisClient = new Redis({
    host: redisHost,
    port: redisPort,
  });

  redisClient.on('error', (err) => app.get(WinstonLogger).error('Redis Client Error', err));
  redisClient.on('connect', () => app.get(WinstonLogger).log('Connected to Redis'));

  app.use(
    session({
      store: new RedisStore({ client: redisClient, prefix: 'chat_session:' }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false, // Only save sessions that are modified
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    }),
  );

  // --- Swagger API Documentation ---
  const config = new DocumentBuilder()
    .setTitle('Real-time Chat Application API')
    .setDescription('The API documentation for the real-time chat application')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token', // This name is important for security definitions
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  app.get(WinstonLogger).log(`Application listening on port ${port}`);
}
bootstrap();