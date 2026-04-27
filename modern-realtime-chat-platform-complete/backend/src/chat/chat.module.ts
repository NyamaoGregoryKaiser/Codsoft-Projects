import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './room.entity';
import { Message } from './message.entity';
import { RoomMember } from './room-member.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { WinstonLoggerModule } from '../common/logger/winston-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Message, RoomMember]),
    UsersModule, // ChatService needs to interact with users
    AuthModule, // For authenticating WebSocket connections
    WinstonLoggerModule,
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService], // Export if other modules need to interact with chat logic
})
export class ChatModule {}