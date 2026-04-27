import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { RoomMember } from './room-member.entity';
import { Message } from './message.entity';
import { User } from '../users/user.entity';

export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DIRECT = 'direct', // For 1-on-1 chats
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.PUBLIC })
  type: RoomType;

  @ManyToOne(() => User, user => user.createdRooms, { onDelete: 'SET NULL' }) // If creator is deleted, set creatorId to null
  creator: User;

  @Column({ name: 'creator_id', nullable: true })
  creatorId: string; // Storing FK explicitly for easier queries if needed

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // --- Relationships ---
  @OneToMany(() => RoomMember, roomMember => roomMember.room, { cascade: true }) // Cascade allows saving members with room
  members: RoomMember[];

  @OneToMany(() => Message, message => message.room, { cascade: true }) // Cascade allows deleting messages when room is deleted
  messages: Message[];
}