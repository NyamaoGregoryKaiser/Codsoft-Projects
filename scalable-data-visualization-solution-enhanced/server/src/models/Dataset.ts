```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Visualization } from './Visualization';

export enum FileType {
  CSV = 'csv',
  JSON = 'json',
}

@Entity()
export class Dataset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: FileType })
  fileType!: FileType;

  @Column({ type: 'text' }) // Store data directly as text (e.g., CSV string or JSON string)
  data!: string;

  @ManyToOne(() => User, user => user.datasets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @OneToMany(() => Visualization, visualization => visualization.dataset)
  visualizations!: Visualization[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```