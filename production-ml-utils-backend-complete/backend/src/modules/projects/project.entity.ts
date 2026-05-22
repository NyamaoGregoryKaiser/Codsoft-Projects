```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Dataset } from '../datasets/dataset.entity';
import { Model } from '../models/model.entity';
import { Experiment } from '../experiments/experiment.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @ManyToOne(() => User, user => user.projects, { onDelete: 'CASCADE' })
  owner!: User;

  @Column({ type: 'uuid' })
  ownerId!: string; // Explicit column for the foreign key

  @OneToMany(() => Dataset, dataset => dataset.project)
  datasets!: Dataset[];

  @OneToMany(() => Model, model => model.project)
  models!: Model[];

  @OneToMany(() => Experiment, experiment => experiment.project)
  experiments!: Experiment[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
```