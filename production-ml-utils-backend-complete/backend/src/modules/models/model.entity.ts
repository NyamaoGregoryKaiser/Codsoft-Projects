```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Experiment } from '../experiments/experiment.entity';

@Entity('models')
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 50 })
  version!: string;

  @Column({ type: 'varchar', length: 500 })
  filePath!: string; // Path to the stored model file

  @Column({ type: 'numeric' })
  fileSize!: number; // Size in bytes

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @ManyToOne(() => Project, project => project.models, { onDelete: 'CASCADE' })
  project!: Project;

  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => User, user => user.models, { onDelete: 'CASCADE' })
  owner!: User;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @OneToMany(() => Experiment, experiment => experiment.model)
  experiments!: Experiment[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
```