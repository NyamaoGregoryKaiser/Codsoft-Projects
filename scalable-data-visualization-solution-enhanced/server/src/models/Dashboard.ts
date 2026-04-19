```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from './User';
import { Visualization } from './Visualization';

export interface DashboardLayoutItem {
  i: string; // Visualization ID
  x: number;
  y: number;
  w: number;
  h: number;
}

@Entity()
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => User, user => user.dashboards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @Column({ type: 'jsonb', default: [] })
  layout!: DashboardLayoutItem[]; // Stores layout information for visualizations

  @ManyToMany(() => Visualization, visualization => visualization.dashboards, { cascade: true })
  @JoinTable({
    name: 'dashboard_visualizations',
    joinColumn: { name: 'dashboardId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'visualizationId', referencedColumnName: 'id' },
  })
  visualizations!: Visualization[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```