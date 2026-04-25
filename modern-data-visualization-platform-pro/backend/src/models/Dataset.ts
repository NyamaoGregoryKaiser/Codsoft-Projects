import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Visualization } from './Visualization';

/**
 * @interface ColumnMetadata
 * @description Defines the structure for inferred column metadata of a dataset.
 */
export interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date'; // Basic types, can be expanded
}

/**
 * @class Dataset
 * @description Represents a raw dataset uploaded by a user.
 */
@Entity('datasets')
export class Dataset {
  /**
   * Unique identifier for the dataset.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Foreign key to the User who owns this dataset.
   */
  @Column({ type: 'uuid', nullable: false })
  ownerId!: string;

  /**
   * Many-to-one relationship with User. A dataset belongs to one user.
   */
  @ManyToOne(() => User, user => user.datasets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  /**
   * Name of the dataset.
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  /**
   * Optional description for the dataset.
   */
  @Column({ type: 'text', nullable: true })
  description!: string;

  /**
   * The actual data of the dataset, stored as JSONB.
   * This allows flexible schema-less storage for various data structures.
   */
  @Column({ type: 'jsonb', nullable: false })
  data!: object[];

  /**
   * Inferred metadata about the columns in the dataset (e.g., column names and types).
   * Stored as JSONB for flexibility.
   */
  @Column({ type: 'jsonb', nullable: true })
  columnMetadata!: ColumnMetadata[];

  /**
   * Date and time when the dataset was created.
   */
  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  /**
   * Date and time when the dataset was last updated.
   */
  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  /**
   * One-to-many relationship with Visualizations. A dataset can be used by multiple visualizations.
   * When a dataset is deleted, associated visualizations should also be deleted or orphaned.
   * Cascade is often 'SET NULL' or handled by application logic if we want to retain viz config without data.
   * Here, we'll assume cascade delete for simplicity to keep relationships consistent.
   */
  @OneToMany(() => Visualization, visualization => visualization.dataset, { cascade: ['remove'], onDelete: 'CASCADE' })
  visualizations!: Visualization[];
}