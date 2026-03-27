import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  username!: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  email!: string;

  @Column({ type: 'varchar', nullable: false, select: false }) // Password should not be selected by default
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
    nullable: false,
  })
  role!: UserRole;

  @OneToMany(() => Project, (project) => project.createdBy)
  createdProjects!: Project[];

  @OneToMany(() => Task, (task) => task.assignedTo)
  assignedTasks!: Task[];

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks!: Task[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}