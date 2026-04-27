import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RoomMember } from '../chat/room-member.entity';
import { Message } from '../chat/message.entity';
import { Room } from '../chat/room.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ select: false }) // Password should not be selected by default
  password: string;

  @Column({ default: 'avatar.png' })
  avatar: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // --- Relationships ---
  @OneToMany(() => RoomMember, roomMember => roomMember.user)
  roomMembers: RoomMember[];

  @OneToMany(() => Message, message => message.sender)
  messages: Message[];

  @OneToMany(() => Room, room => room.creator)
  createdRooms: Room[];
}