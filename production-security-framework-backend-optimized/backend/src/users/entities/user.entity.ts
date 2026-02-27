```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('users')
@Unique(['email']) // Ensure email is unique
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column()
  password: string; // Hashed password

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true, // Allow multiple roles
    default: [UserRole.User],
  })
  roles: UserRole[];

  @OneToMany(() => Project, (project) => project.owner, { cascade: true })
  projects: Project[];

  @OneToMany(() => Task, (task) => task.assignee, { cascade: true })
  assignedTasks: Task[];

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```