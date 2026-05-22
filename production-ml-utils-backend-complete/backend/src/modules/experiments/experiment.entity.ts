```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Model } from '../models/model.entity';
import { Dataset } from '../datasets/dataset.entity';

@Entity('experiments')
export class Experiment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'pending' | 'running' | 'completed' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  parameters!: object; // JSON object for parameters (e.g., learning_rate, epochs)

  @Column({ type: 'jsonb', nullable: true })
  metrics!: object; // JSON object for results/metrics (e.g., accuracy, loss, F1-score)

  @ManyToOne(() => Project, project => project.experiments, { onDelete: 'CASCADE' })
  project!: Project;

  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Model, model => model.experiments, { nullable: true, onDelete: 'SET NULL' })
  model!: Model | null;

  @Column({ type: 'uuid', nullable: true })
  modelId!: string | null;

  @ManyToOne(() => Dataset, dataset => dataset.experiments, { nullable: true, onDelete: 'SET NULL' })
  dataset!: Dataset | null;

  @Column({ type: 'uuid', nullable: true })
  datasetId!: string | null;

  @ManyToOne(() => User, user => user.experiments, { onDelete: 'CASCADE' })
  owner!: User;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endTime!: Date | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
```