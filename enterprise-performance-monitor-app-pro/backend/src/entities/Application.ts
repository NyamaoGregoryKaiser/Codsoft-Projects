import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Page } from './Page';
import { PerformanceMetric } from './PerformanceMetric';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'api_key', unique: true, length: 255 }) // Hashed API key
  apiKey!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.applications)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => Page, (page) => page.application)
  pages!: Page[];

  @OneToMany(() => PerformanceMetric, (metric) => metric.application)
  performanceMetrics!: PerformanceMetric[];
}