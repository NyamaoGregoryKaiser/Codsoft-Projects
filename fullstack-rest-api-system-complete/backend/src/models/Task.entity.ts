import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { IsString, MinLength, MaxLength, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Project } from './Project.entity';
import { User } from './User.entity';
import { Comment } from './Comment.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @ManyToOne(() => Project, project => project.tasks, { onDelete: 'CASCADE' })
  project!: Project;

  @Column({ type: 'uuid' }) // projectId for easier queries
  projectId!: string;

  @ManyToOne(() => User, user => user.assignedTasks, { nullable: true, onDelete: 'SET NULL' })
  @IsOptional()
  assignee?: User;

  @Column({ type: 'uuid', nullable: true }) // assigneeId for easier queries
  @IsOptional()
  assigneeId?: string;

  @OneToMany(() => Comment, comment => comment.task)
  comments!: Comment[];
}