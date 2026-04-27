import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from './room.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system', // For system messages like "User joined"
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.messages, { eager: true, onDelete: 'CASCADE' }) // Eager load sender by default
  sender: User;

  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => Room, room => room.messages, { onDelete: 'CASCADE' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}