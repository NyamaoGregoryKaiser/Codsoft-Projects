import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { IsString, MinLength, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { User } from './User.entity';
import { Task } from './Task.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.projects, { onDelete: 'CASCADE' })
  owner!: User;

  @Column({ type: 'uuid' }) // ownerId for easier queries
  ownerId!: string;

  @OneToMany(() => Task, task => task.project)
  tasks!: Task[];
}