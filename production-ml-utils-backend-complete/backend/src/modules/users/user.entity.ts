```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Project } from '../projects/project.entity';
import { Dataset } from '../datasets/dataset.entity';
import { Model } from '../models/model.entity';
import { Experiment } from '../experiments/experiment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false }) // Password won't be returned by default queries
  password!: string;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role!: 'user' | 'admin';

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @OneToMany(() => Project, project => project.owner)
  projects!: Project[];

  @OneToMany(() => Dataset, dataset => dataset.owner)
  datasets!: Dataset[];

  @OneToMany(() => Model, model => model.owner)
  models!: Model[];

  @OneToMany(() => Experiment, experiment => experiment.owner)
  experiments!: Experiment[];

  // Instance method to compare passwords
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Pre-save hook to hash password (using subscriber for better TypeORM practice, but this works)
  // For simplicity, hashing is often done in service layer or a subscriber.
  // For a robust solution, consider TypeORM Subscribers: https://typeorm.io/#/listeners-and-subscribers
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }
}
```