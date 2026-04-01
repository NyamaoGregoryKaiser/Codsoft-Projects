import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { User } from './User.entity';
import { Task } from './Task.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.comments, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'uuid' }) // userId for easier queries
  userId!: string;

  @ManyToOne(() => Task, task => task.comments, { onDelete: 'CASCADE' })
  task!: Task;

  @Column({ type: 'uuid' }) // taskId for easier queries
  taskId!: string;
}