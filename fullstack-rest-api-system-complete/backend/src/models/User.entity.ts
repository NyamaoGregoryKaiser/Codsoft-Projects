import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsEmail, IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { Project } from './Project.entity';
import { Task } from './Task.entity';
import { Comment } from './Comment.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @IsEmail()
  email!: string;

  @Column({ select: false }) // Password will not be selected by default
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @Column()
  @IsString()
  @MinLength(2)
  firstName!: string;

  @Column()
  @IsString()
  @MinLength(2)
  lastName!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  role!: UserRole;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @OneToMany(() => Project, project => project.owner)
  projects!: Project[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks!: Task[];

  @OneToMany(() => Comment, comment => comment.user)
  comments!: Comment[];

  // Virtual property or helper to combine name for display
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}