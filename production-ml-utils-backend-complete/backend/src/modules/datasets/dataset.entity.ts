```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Experiment } from '../experiments/experiment.entity';

@Entity('datasets')
export class Dataset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 500 })
  filePath!: string; // Path to the stored dataset file

  @Column({ type: 'numeric' })
  fileSize!: number; // Size in bytes

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @ManyToOne(() => Project, project => project.datasets, { onDelete: 'CASCADE' })
  project!: Project;

  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => User, user => user.datasets, { onDelete: 'CASCADE' })
  owner!: User;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @OneToMany(() => Experiment, experiment => experiment.dataset)
  experiments!: Experiment[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
```