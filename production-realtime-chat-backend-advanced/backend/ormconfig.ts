```typescript
import { DataSourceOptions } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Conversation } from './src/conversations/entities/conversation.entity';
import { Message } from './src/messages/entities/message.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: `.env` });

const config: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL, // e.g., "postgresql://user:password@localhost:5432/chat_app"
  synchronize: false, // Never use synchronize in production!
  logging: true,
  entities: [User, Conversation, Message],
  migrations: [__dirname + '/src/migrations/**/*.ts'], // Path to migrations
  subscribers: [],
};

export default config;
```