import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { Message } from './message.entity';
import { RoomMember } from './room-member.entity';
import { UsersService } from '../users/users.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { WinstonLogger } from '../common/logger/winston.logger';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(RoomMember)
    private roomMemberRepository: Repository<RoomMember>,
    private usersService: UsersService,
    private readonly logger: WinstonLogger,
  ) {
    this.logger.setContext('ChatService');
  }

  /**
   * Creates a new chat room.
   * @param createRoomDto DTO for creating a room.
   * @param creatorId ID of the user creating the room.
   * @returns The created room.
   */
  async createRoom(createRoomDto: CreateRoomDto, creatorId: string): Promise<Room> {
    this.logger.log(`User ${creatorId} attempting to create room: ${createRoomDto.name}`);
    const creator = await this.usersService.findById(creatorId);
    if (!creator) {
      this.logger.error(`Room creation failed: Creator with ID ${creatorId} not found.`);
      throw new NotFoundException('Creator not found');
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      creator,
    });
    await this.roomRepository.save(room);

    // Add creator as a member of the room
    await this.addRoomMember(room.id, creatorId);
    this.logger.log(`Room '${room.name}' (ID: ${room.id}) created by ${creator.username}.`);
    return room;
  }

  /**
   * Finds all rooms a user is a member of.
   * @param userId ID of the user.
   * @returns Array of rooms.
   */
  async findRoomsForUser(userId: string): Promise<Room[]> {
    this.logger.log(`Fetching rooms for user ID: ${userId}`);
    const roomMembers = await this.roomMemberRepository.find({
      where: { user: { id: userId } },
      relations: ['room', 'room.creator'], // Eager load room and its creator
    });
    return roomMembers.map(rm => rm.room);
  }

  /**
   * Finds a room by its ID.
   * @param roomId ID of the room.
   * @returns The room if found.
   * @throws NotFoundException if the room is not found.
   */
  async findRoomById(roomId: string): Promise<Room> {
    this.logger.log(`Fetching room by ID: ${roomId}`);
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['creator', 'members.user'], // Eager load creator and members with user details
    });
    if (!room) {
      this.logger.warn(`Room with ID ${roomId} not found.`);
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }
    return room;
  }

  /**
   * Adds a user to a room as a member.
   * @param roomId ID of the room.
   * @param userId ID of the user to add.
   * @returns The created room member.
   */
  async addRoomMember(roomId: string, userId: string): Promise<RoomMember> {
    this.logger.log(`Adding user ${userId} to room ${roomId}`);
    const room = await this.findRoomById(roomId);
    const user = await this.usersService.findById(userId);

    const existingMember = await this.roomMemberRepository.findOne({ where: { room: { id: roomId }, user: { id: userId } } });
    if (existingMember) {
      this.logger.warn(`User ${userId} is already a member of room ${roomId}.`);
      throw new BadRequestException('User is already a member of this room');
    }

    const roomMember = this.roomMemberRepository.create({ room, user });
    await this.roomMemberRepository.save(roomMember);
    this.logger.log(`User ${user.username} (ID: ${userId}) added to room '${room.name}' (ID: ${roomId}).`);
    return roomMember;
  }

  /**
   * Removes a user from a room.
   * @param roomId ID of the room.
   * @param userId ID of the user to remove.
   */
  async removeRoomMember(roomId: string, userId: string): Promise<void> {
    this.logger.log(`Removing user ${userId} from room ${roomId}`);
    const room = await this.findRoomById(roomId); // Ensure room exists
    const user = await this.usersService.findById(userId); // Ensure user exists

    const result = await this.roomMemberRepository.delete({ room: { id: roomId }, user: { id: userId } });
    if (result.affected === 0) {
      this.logger.warn(`User ${userId} was not found as a member of room ${roomId}.`);
      throw new NotFoundException('User is not a member of this room');
    }
    this.logger.log(`User ${user.username} (ID: ${userId}) removed from room '${room.name}' (ID: ${roomId}).`);
  }

  /**
   * Sends a message to a room.
   * @param createMessageDto DTO for creating a message.
   * @param senderId ID of the message sender.
   * @returns The created message.
   */
  async sendMessage(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {
    this.logger.log(`User ${senderId} sending message to room ${createMessageDto.roomId}`);
    const sender = await this.usersService.findById(senderId);
    const room = await this.findRoomById(createMessageDto.roomId);

    // Check if sender is a member of the room
    const isMember = await this.roomMemberRepository.findOne({ where: { room: { id: room.id }, user: { id: sender.id } } });
    if (!isMember) {
      this.logger.warn(`User ${senderId} attempted to send message to room ${room.id} but is not a member.`);
      throw new ForbiddenException('You are not a member of this room.');
    }

    const message = this.messageRepository.create({
      content: createMessageDto.content,
      room,
      sender,
      type: createMessageDto.type || 'text',
    });
    await this.messageRepository.save(message);
    this.logger.log(`Message sent by ${sender.username} to room ${room.name} (ID: ${message.id}).`);
    return message;
  }

  /**
   * Retrieves messages for a specific room.
   * @param roomId ID of the room.
   * @param limit Maximum number of messages to retrieve.
   * @param offset Number of messages to skip.
   * @returns Array of messages.
   */
  async getRoomMessages(roomId: string, limit = 50, offset = 0): Promise<Message[]> {
    this.logger.log(`Fetching messages for room ${roomId} (limit: ${limit}, offset: ${offset})`);
    const room = await this.findRoomById(roomId); // Ensure room exists
    return this.messageRepository.find({
      where: { room: { id: roomId } },
      relations: ['sender'], // Eager load sender details
      order: { timestamp: 'DESC' }, // Newest messages first
      take: limit,
      skip: offset,
    });
  }
}