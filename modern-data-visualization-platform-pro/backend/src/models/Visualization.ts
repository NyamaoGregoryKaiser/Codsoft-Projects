import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';
import { Dataset } from './Dataset';
import { Dashboard } from './Dashboard';

/**
 * @enum ChartType
 * @description Defines the supported types of visualizations.
 */
export enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Pie = 'pie',
  Table = 'table',
  // Add more chart types as needed
}

/**
 * @class Visualization
 * @description Represents a single data visualization (chart, table, etc.).
 */
@Entity('visualizations')
@Index(['dashboardId', 'createdAt']) // Example index for performance on dashboards
export class Visualization {
  /**
   * Unique identifier for the visualization.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Foreign key to the User who owns this visualization.
   * This is the primary owner, even if it's placed on a shared dashboard.
   */
  @Column({ type: 'uuid', nullable: false })
  ownerId!: string;

  /**
   * Many-to-one relationship with User. A visualization primarily belongs to one user.
   */
  @ManyToOne(() => User, user => user.visualizations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  /**
   * Name of the visualization.
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  /**
   * Optional description for the visualization.
   */
  @Column({ type: 'text', nullable: true })
  description!: string;

  /**
   * The type of chart or visualization (e.g., 'bar', 'line', 'pie', 'table').
   */
  @Column({ type: 'enum', enum: ChartType, nullable: false })
  type!: ChartType;

  /**
   * JSON configuration specific to the chart library and type.
   * E.g., for a bar chart: { xAxis: { field: 'country' }, yAxis: { field: 'sales' } }
   */
  @Column({ type: 'jsonb', nullable: false, default: {} })
  config!: Record<string, any>;

  /**
   * Foreign key to the Dataset used for this visualization.
   */
  @Column({ type: 'uuid', nullable: false })
  datasetId!: string;

  /**
   * Many-to-one relationship with Dataset. A visualization uses one dataset.
   * If the dataset is deleted, this visualization might become invalid or should be deleted.
   */
  @ManyToOne(() => Dataset, dataset => dataset.visualizations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'datasetId' })
  dataset!: Dataset;

  /**
   * Foreign key to the Dashboard this visualization is part of. Optional.
   * If null, it's a standalone visualization.
   */
  @Column({ type: 'uuid', nullable: true })
  dashboardId!: string | null;

  /**
   * Many-to-one relationship with Dashboard. A visualization can belong to one dashboard.
   * If the dashboard is deleted, this visualization should also be deleted (cascade).
   */
  @ManyToOne(() => Dashboard, dashboard => dashboard.visualizations, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dashboardId' })
  dashboard!: Dashboard | null;

  /**
   * Date and time when the visualization was created.
   */
  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  /**
   * Date and time when the visualization was last updated.
   */
  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}