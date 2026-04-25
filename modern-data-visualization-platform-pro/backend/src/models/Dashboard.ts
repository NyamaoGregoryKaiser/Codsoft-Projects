import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Visualization } from './Visualization';

/**
 * @class Dashboard
 * @description Represents a dashboard created by a user to display multiple visualizations.
 */
@Entity('dashboards')
export class Dashboard {
  /**
   * Unique identifier for the dashboard.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Foreign key to the User who owns this dashboard.
   */
  @Column({ type: 'uuid', nullable: false })
  ownerId!: string;

  /**
   * Many-to-one relationship with User. A dashboard belongs to one user.
   */
  @ManyToOne(() => User, user => user.dashboards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  /**
   * Name of the dashboard.
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  /**
   * Optional description for the dashboard.
   */
  @Column({ type: 'text', nullable: true })
  description!: string;

  /**
   * Date and time when the dashboard was created.
   */
  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  /**
   * Date and time when the dashboard was last updated.
   */
  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  /**
   * One-to-many relationship with Visualizations. A dashboard can contain multiple visualizations.
   * When a dashboard is deleted, its associated visualizations should also be deleted (cascade delete).
   */
  @OneToMany(() => Visualization, visualization => visualization.dashboard, { cascade: true, onDelete: 'CASCADE' })
  visualizations!: Visualization[];
}