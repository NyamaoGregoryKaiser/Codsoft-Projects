import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Dataset } from './Dataset';
import { Dashboard } from './Dashboard';
import { Visualization } from './Visualization';

/**
 * @class User
 * @description Represents a user in the system.
 */
@Entity('users')
export class User {
  /**
   * Unique identifier for the user.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * User's unique username.
   */
  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  username!: string;

  /**
   * User's unique email address.
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email!: string;

  /**
   * Hashed password for security.
   */
  @Column({ type: 'varchar', length: 255, select: false }) // select: false hides it by default
  passwordHash!: string;

  /**
   * Date and time when the user account was created.
   */
  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  /**
   * Date and time when the user account was last updated.
   */
  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  /**
   * One-to-many relationship with Datasets. A user can own many datasets.
   * Cascade delete ensures that if a user is deleted, their datasets are also deleted.
   */
  @OneToMany(() => Dataset, dataset => dataset.owner, { cascade: true, onDelete: 'CASCADE' })
  datasets!: Dataset[];

  /**
   * One-to-many relationship with Dashboards. A user can own many dashboards.
   * Cascade delete ensures that if a user is deleted, their dashboards (and implicitly visualizations) are also deleted.
   */
  @OneToMany(() => Dashboard, dashboard => dashboard.owner, { cascade: true, onDelete: 'CASCADE' })
  dashboards!: Dashboard[];

  /**
   * One-to-many relationship with Visualizations. A user can own many visualizations.
   * This is for visualizations not directly attached to a dashboard, or as a fallback ownership.
   * Cascade delete ensures that if a user is deleted, their standalone visualizations are also deleted.
   */
  @OneToMany(() => Visualization, visualization => visualization.owner, { cascade: true, onDelete: 'CASCADE' })
  visualizations!: Visualization[];
}