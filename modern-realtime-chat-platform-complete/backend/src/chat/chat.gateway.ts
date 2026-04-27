import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, WsException } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../common/guards/ws-jwt-auth.guard'; // Custom WebSocket JWT guard
import { User } from '../users/user.entity';
import { WsAuthUser } from '../common/decorators/ws-auth-user.decorator';
import { WinstonLogger } from '../common/logger/winston.logger';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';

interface AuthenticatedSocket extends Socket {
  user: User; // Custom property to hold the authenticated user
}

@UseGuards(WsJwtAuthGuard) // Apply JWT authentication to all WebSocket messages
@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production, typically use configService.get('FRONTEND_URL')
    credentials: true,
  },
  namespace: '/chat', // Custom namespace for chat
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly logger: WinstonLogger,
  ) {
    this.logger.setContext('ChatGateway');
  }

  /**
   * Handles new WebSocket connections.
   * The `WsJwtAuthGuard` will have already attached the user to the socket.
   * @param client The connected socket.
   */
  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id} (User: ${client.user?.username || 'Unauthenticated'})`);
    // Optionally, if authenticated, join a 'user_id' specific room for private notifications
    if (client.user) {
      client.join(`user_${client.user.id}`);
      // Find all rooms the user is a member of and make them join those rooms in Socket.IO
      const rooms = await this.chatService.findRoomsForUser(client.user.id);
      rooms.forEach(room => {
        client.join(`room_${room.id}`);
        this.logger.debug(`User ${client.user.username} joined Socket.IO room: room_${room.id}`);
      });
      this.server.emit('userStatus', { userId: client.user.id, status: 'online' }); // Notify users
    }
  }

  /**
   * Handles WebSocket disconnections.
   * @param client The disconnected socket.
   */
  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id} (User: ${client.user?.username || 'Unauthenticated'})`);
    if (client.user) {
      this.server.emit('userStatus', { userId: client.user.id, status: 'offline' }); // Notify users
    }
  }

  /**
   * Handles 'sendMessage' event.
   * @param client The sender's socket.
   * @param createMessageDto DTO containing message content and room ID.
   * @param user The authenticated user from the JWT.
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createMessageDto: CreateMessageDto,
    @WsAuthUser() user: User, // Custom decorator to extract user from socket
  ) {
    try {
      this.logger.verbose(`User ${user.username} sending message to room ${createMessageDto.roomId}`);
      const message = await this.chatService.sendMessage(createMessageDto, user.id);
      // Emit the message to all clients in the specific room
      this.server.to(`room_${message.room.id}`).emit('newMessage', {
        id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        sender: { id: user.id, username: user.username, avatar: user.avatar },
        roomId: message.room.id,
      });
      this.logger.log(`Message ${message.id} sent by ${user.username} to room ${message.room.id}`);
      return { event: 'messageSent', data: { success: true, messageId: message.id } };
    } catch (error) {
      this.logger.error(`Failed to send message for user ${user.username}: ${error.message}`, error.stack);
      throw new WsException(error.message);
    }
  }

  /**
   * Handles 'createRoom' event.
   * @param createRoomDto DTO for creating a room.
   * @param user The authenticated user.
   */
  @SubscribeMessage('createRoom')
  async handleCreateRoom(@MessageBody() createRoomDto: CreateRoomDto, @WsAuthUser() user: User) {
    try {
      this.logger.verbose(`User ${user.username} attempting to create room: ${createRoomDto.name}`);
      const newRoom = await this.chatService.createRoom(createRoomDto, user.id);
      // Make the creator join the socket.io room immediately
      this.server.sockets.sockets.get(user.id)?.join(`room_${newRoom.id}`); // Find specific client by user ID (if you map client.id to user.id)
      // Alternatively, the client will join on next connect if their rooms are loaded on connect
      this.server.to(`user_${user.id}`).emit('roomCreated', newRoom); // Notify creator
      this.logger.log(`Room '${newRoom.name}' created by ${user.username}.`);
      return { event: 'roomCreated', data: { success: true, roomId: newRoom.id } };
    } catch (error) {
      this.logger.error(`Failed to create room for user ${user.username}: ${error.message}`, error.stack);
      throw new WsException(error.message);
    }
  }

  /**
   * Handles 'joinRoom' event.
   * @param client The joining client.
   * @param joinRoomDto DTO containing room ID.
   * @param user The authenticated user.
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() joinRoomDto: JoinRoomDto,
    @WsAuthUser() user: User,
  ) {
    try {
      this.logger.verbose(`User ${user.username} attempting to join room ${joinRoomDto.roomId}`);
      const roomMember = await this.chatService.addRoomMember(joinRoomDto.roomId, user.id);
      client.join(`room_${joinRoomDto.roomId}`); // Make the client join the Socket.IO room
      this.server.to(`room_${joinRoomDto.roomId}`).emit('userJoinedRoom', {
        roomId: joinRoomDto.roomId,
        userId: user.id,
        username: user.username,
      });
      this.logger.log(`User ${user.username} joined room ${joinRoomDto.roomId}.`);
      return { event: 'roomJoined', data: { success: true, roomId: joinRoomDto.roomId } };
    } catch (error) {
      this.logger.error(`Failed to join room ${joinRoomDto.roomId} for user ${user.username}: ${error.message}`, error.stack);
      throw new WsException(error.message);
    }
  }

  /**
   * Handles 'leaveRoom' event.
   * @param client The leaving client.
   * @param leaveRoomDto DTO containing room ID.
   * @param user The authenticated user.
   */
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() leaveRoomDto: LeaveRoomDto,
    @WsAuthUser() user: User,
  ) {
    try {
      this.logger.verbose(`User ${user.username} attempting to leave room ${leaveRoomDto.roomId}`);
      await this.chatService.removeRoomMember(leaveRoomDto.roomId, user.id);
      client.leave(`room_${leaveRoomDto.roomId}`); // Make the client leave the Socket.IO room
      this.server.to(`room_${leaveRoomDto.roomId}`).emit('userLeftRoom', {
        roomId: leaveRoomDto.roomId,
        userId: user.id,
        username: user.username,
      });
      this.logger.log(`User ${user.username} left room ${leaveRoomDto.roomId}.`);
      return { event: 'roomLeft', data: { success: true, roomId: leaveRoomDto.roomId } };
    } catch (error) {
      this.logger.error(`Failed to leave room ${leaveRoomDto.roomId} for user ${user.username}: ${error.message}`, error.stack);
      throw new WsException(error.message);
    }
  }

  /**
   * Handles 'getRoomMessages' event.
   * @param roomId The ID of the room.
   * @param limit The number of messages to retrieve.
   * @param offset The offset for pagination.
   * @param user The authenticated user.
   */
  @SubscribeMessage('getRoomMessages')
  async handleGetRoomMessages(
    @MessageBody('roomId') roomId: string,
    @MessageBody('limit') limit: number = 50,
    @MessageBody('offset') offset: number = 0,
    @WsAuthUser() user: User,
  ) {
    try {
      // Before fetching, ensure the user is a member of the room
      const room = await this.chatService.findRoomById(roomId);
      const isMember = room.members.some(member => member.user.id === user.id);
      if (!isMember) {
        throw new WsException('You are not authorized to view messages in this room.');
      }

      this.logger.verbose(`User ${user.username} fetching messages for room ${roomId}`);
      const messages = await this.chatService.getRoomMessages(roomId, limit, offset);
      // Transform messages to a cleaner format if needed, removing sensitive info like sender password
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.type,
        sender: { id: msg.sender.id, username: msg.sender.username, avatar: msg.sender.avatar },
        roomId: msg.room.id,
      }));
      return { event: 'roomMessages', data: { roomId, messages: formattedMessages } };
    } catch (error) {
      this.logger.error(`Failed to get messages for room ${roomId} by user ${user.username}: ${error.message}`, error.stack);
      throw new WsException(error.message);
    }
  }

  // --- Add other chat-related WebSocket events here (e.g., typing indicators, read receipts) ---
  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody('roomId') roomId: string) {
    client.to(`room_${roomId}`).emit('typing', { roomId, userId: client.user.id, username: client.user.username });
  }
}