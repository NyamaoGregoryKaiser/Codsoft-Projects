import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { ScrapeJob } from './ScrapeJob';
import { IsBoolean } from 'class-validator';

@Entity('scraped_data')
export class ScrapedData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ScrapeJob, job => job.scrapedData, { onDelete: 'CASCADE' })
  scrapeJob!: ScrapeJob;

  @Column({ name: 'jobId' }) // Explicit column for foreign key
  jobId!: string;

  @Column({ type: 'jsonb' })
  data!: Record<string, any>;

  @Column()
  urlUsed!: string;

  @Column({ default: true })
  @IsBoolean({ message: 'Success must be a boolean' })
  success!: boolean;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  @Index() // Index for faster lookups by scrapedAt
  scrapedAt!: Date;
}