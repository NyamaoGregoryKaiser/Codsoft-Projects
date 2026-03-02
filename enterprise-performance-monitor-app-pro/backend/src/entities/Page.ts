import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Application } from './Application';
import { PerformanceMetric } from './PerformanceMetric';

@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ name: 'path_regex', length: 255, nullable: true })
  pathRegex?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Application, (application) => application.pages)
  @JoinColumn({ name: 'application_id' })
  application!: Application;

  @OneToMany(() => PerformanceMetric, (metric) => metric.page)
  performanceMetrics!: PerformanceMetric[];
}