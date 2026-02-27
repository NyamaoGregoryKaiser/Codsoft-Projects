```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { TaskStatus } from '../enums/task-status.enum';

@Entity('tasks')
@Index(['title', 'projectId'], { unique: false }) // Title can be repeated across tasks within a project, not necessarily unique
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.Open,
  })
  status: TaskStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate: Date;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  project: Project;

  @Column() // Store project ID directly
  projectId: string;

  @ManyToOne(() => User, (user) => user.assignedTasks, { nullable: true, onDelete: 'SET NULL' })
  assignee: User;

  @Column({ nullable: true }) // Store assignee ID directly
  assigneeId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) // User who created the task
  creator: User;

  @Column({ nullable: true }) // Store creator ID directly
  creatorId: string;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```