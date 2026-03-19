```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { UseGuards, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from '../messages/message.service';
import { ConversationService } from '../conversations/conversation.service';
import { AuthenticatedSocket } from './types/socket.types';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: 'chat', // Use a specific namespace for chat
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
    private prisma: PrismaService,
    private messageService: MessageService,
    private conversationService: ConversationService,
  ) {}

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      // Authenticate WebSocket connection
      const token = client.handshake.auth.token;
      if (!token) {
        this.logger.warn(`Unauthorized WebSocket connection attempt (no token).`);
        client.disconnect(true);
        return;
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const user = await this.authService.validateUserById(payload.sub);
      if (!user) {
        this.logger.warn(`Unauthorized WebSocket connection attempt (user not found for token).`);
        client.disconnect(true);
        return;
      }
      client.user = user;
      this.logger.log(`Client connected: ${client.id} | User: ${user.username}`);

      // Add user to connected users map
      const userSockets = this.connectedUsers.get(user.id) || [];
      userSockets.push(client.id);
      this.connectedUsers.set(user.id, userSockets);

      // Fetch user's conversations and join rooms
      const conversations = await this.conversationService.getUserConversations(user.id);
      for (const conv of conversations) {
        client.join(`conversation_${conv.id}`);
        this.logger.debug(`User ${user.username} joined room conversation_${conv.id}`);
      }

      // Emit user status to all connected clients
      this.server.emit('user_status', { userId: user.id, status: 'online' });
    } catch (e) {
      this.logger.error(`WebSocket authentication failed for client ${client.id}: ${e.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.logger.log(`Client disconnected: ${client.id} | User: ${client.user.username}`);

      // Remove socket from connected users map
      const userSockets = this.connectedUsers.get(client.user.id);
      if (userSockets) {
        const updatedSockets = userSockets.filter((socketId) => socketId !== client.id);
        if (updatedSockets.length === 0) {
          this.connectedUsers.delete(client.user.id);
          // Emit user status to all connected clients (only if no other sockets for this user are online)
          this.server.emit('user_status', { userId: client.user.id, status: 'offline' });
        } else {
          this.connectedUsers.set(client.user.id, updatedSockets);
        }
      }
    } else {
      this.logger.log(`Unauthenticated client disconnected: ${client.id}`);
    }
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const senderId = client.user.id;
      const message = await this.messageService.sendMessage(senderId, data);
      this.logger.debug(`New message from ${client.user.username} in conversation ${data.conversationId}`);

      // Emit message to all participants in the conversation room
      this.server.to(`conversation_${data.conversationId}`).emit('message', message);
      // Update conversation list for all participants (e.g. move to top)
      this.server.to(`conversation_${data.conversationId}`).emit('conversation_updated', {
        conversationId: data.conversationId,
        latestMessage: message,
      });

      return { event: 'message_sent', data: message };
    } catch (e) {
      this.logger.error(`Error sending message: ${e.message}`);
      client.emit('error', { event: 'message_error', message: e.message });
      // throw new WsException(e.message); // This would disconnect the client
      return { event: 'message_error', message: e.message, status: 'failed' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Broadcast typing indicator to all other participants in the room
    client.to(`conversation_${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId: client.user.id,
      username: client.user.username,
      isTyping: data.isTyping,
    });
    this.logger.debug(
      `User ${client.user.username} is ${data.isTyping ? 'typing' : 'not typing'} in conversation ${data.conversationId}`,
    );
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const conversation = await this.conversationService.getConversationById(data.conversationId);
      const isParticipant = conversation.participants.some((p) => p.userId === client.user.id);

      if (!isParticipant) {
        throw new WsException('You are not a participant of this conversation.');
      }

      client.join(`conversation_${data.conversationId}`);
      this.logger.log(`User ${client.user.username} joined Socket.IO room conversation_${data.conversationId}`);
      client.emit('joined_conversation', { conversationId: data.conversationId, status: 'success' });
    } catch (e) {
      this.logger.error(`Error joining conversation: ${e.message}`);
      client.emit('error', { event: 'join_conversation_error', message: e.message });
      return { event: 'join_conversation_error', message: e.message, status: 'failed' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string; conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const updatedMessage = await this.messageService.markMessageAsRead(data.messageId, client.user.id);
      this.logger.debug(`Message ${data.messageId} marked as read by ${client.user.username}`);
      // Emit to all participants in the conversation that a message has been read
      this.server.to(`conversation_${data.conversationId}`).emit('message_read', {
        messageId: updatedMessage.id,
        conversationId: updatedMessage.conversationId,
        readerId: client.user.id,
        readBy: updatedMessage.readBy.map(r => r.userId),
      });
      return { event: 'mark_as_read_success', messageId: data.messageId };
    } catch (e) {
      this.logger.error(`Error marking message as read: ${e.message}`);
      client.emit('error', { event: 'mark_as_read_error', message: e.message });
      return { event: 'mark_as_read_error', message: e.message, status: 'failed' };
    }
  }

  // Helper method to emit events to specific users
  emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
```