import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  token!: string;

  @Column()
  expiresAt!: Date;

  @Column({ default: false })
  isRevoked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: string; // Foreign key column
}