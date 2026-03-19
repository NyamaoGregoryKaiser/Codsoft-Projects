```typescript
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversation.module';
import { MessagesModule } from '../messages/message.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, ConversationsModule, MessagesModule, PrismaModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class GatewayModule {}
```