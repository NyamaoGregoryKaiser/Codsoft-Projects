```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { User } from './User';
import { Dataset } from './Dataset';
import { Dashboard } from './Dashboard';

export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  SCATTER = 'scatter',
  TABLE = 'table', // Custom type for tabular data display
}

export interface ChartConfig {
  labelsField: string; // Field from dataset for chart labels (x-axis or segments)
  dataField: string;   // Field from dataset for chart data values (y-axis)
  title?: string;
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  // Add more chart.js specific config options here as needed
  // e.g., xAxisLabel, yAxisLabel, responsive, maintainAspectRatio, legend, tooltips etc.
}

@Entity()
export class Visualization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ChartType })
  chartType!: ChartType;

  @Column({ type: 'jsonb' })
  config!: ChartConfig; // JSON configuration for the chart

  @ManyToOne(() => User, user => user.visualizations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Dataset, dataset => dataset.visualizations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'datasetId' })
  dataset!: Dataset;

  @Column({ nullable: true })
  datasetId?: string; // Nullable if dataset is deleted

  @ManyToMany(() => Dashboard, dashboard => dashboard.visualizations)
  dashboards!: Dashboard[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```