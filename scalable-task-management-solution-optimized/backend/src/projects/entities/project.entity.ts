import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isCompleted: boolean;

  @ManyToOne(() => User, user => user.projects, { onDelete: 'CASCADE' }) // If user is deleted, projects are deleted
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'uuid' }) // Store owner ID directly
  ownerId: string;

  @OneToMany(() => Task, task => task.project)
  tasks: Task[];

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}