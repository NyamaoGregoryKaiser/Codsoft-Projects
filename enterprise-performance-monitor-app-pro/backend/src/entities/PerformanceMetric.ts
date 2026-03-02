import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Application } from './Application';
import { Page } from './Page';

@Entity('performance_metrics')
@Index(['applicationId', 'metricType', 'timestamp'])
@Index(['pageId', 'metricType', 'timestamp'])
@Index(['timestamp'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @Column({ name: 'page_id', type: 'uuid', nullable: true })
  pageId?: string;

  @Column({ name: 'metric_type', length: 50 })
  metricType!: string; // e.g., 'FCP', 'LCP', 'TTFB', 'CLS', 'custom_metric_name'

  @Column({ type: 'double precision' })
  value!: number; // Metric value, e.g., milliseconds, score

  @Column({ name: 'user_session_id', type: 'uuid', nullable: true })
  userSessionId?: string;

  @Column({ nullable: true, length: 50 })
  browser?: string;

  @Column({ nullable: true, length: 50 })
  os?: string;

  @Column({ name: 'device_type', nullable: true, length: 20 })
  deviceType?: string; // 'desktop', 'mobile', 'tablet'

  @Column({ nullable: true, length: 50 })
  country?: string; // ISO 3166-1 alpha-2 code, or full name

  @Column({ nullable: true, type: 'text' })
  url?: string; // The URL where the metric was collected

  @CreateDateColumn({ name: 'timestamp' })
  timestamp!: Date;

  @ManyToOne(() => Application, (application) => application.performanceMetrics)
  @JoinColumn({ name: 'application_id' })
  application!: Application;

  @ManyToOne(() => Page, (page) => page.performanceMetrics, { nullable: true })
  @JoinColumn({ name: 'page_id' })
  page?: Page;
}