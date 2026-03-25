```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { ChatGatewayModule } from './gateway/chat.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { User } from './users/entities/user.entity';
import { Conversation } from './conversations/entities/conversation.entity';
import { Message } from './messages/entities/message.entity';
import { ConfigModule as AppConfigModule } from './config/config.module';

@Module({
  imports: [
    // Configure DotEnv globally
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule available everywhere
      envFilePath: `.env`,
    }),
    // TypeORM Database Configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, Conversation, Message],
        synchronize: false, // Never use synchronize in production!
        logging: config.get<string>('NODE_ENV') === 'development', // Log queries in dev
      }),
    }),
    AppConfigModule, // Custom ConfigService for structured configuration
    AuthModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    ChatGatewayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // Apply logger to all routes
  }
}
```