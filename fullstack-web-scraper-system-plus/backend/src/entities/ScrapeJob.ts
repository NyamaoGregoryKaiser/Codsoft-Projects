import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsUrl, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { User } from './User';
import { ScrapedData } from './ScrapedData';
import { ScrapeLog } from './ScrapeLog';
import { ScrapeJobStatus } from '../types/enums';

@Entity('scrape_jobs')
export class ScrapeJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, user => user.scrapeJobs, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ name: 'userId' }) // Explicit column for foreign key
  userId!: string;

  @Column()
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url!: string;

  @Column()
  @IsString({ message: 'CSS selector must be a string' })
  @IsNotEmpty({ message: 'CSS selector cannot be empty' })
  cssSelector!: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Schedule must be a valid cron expression or keyword' })
  schedule?: string; // Cron expression or keywords like 'daily', 'hourly'

  @Column({
    type: 'enum',
    enum: ScrapeJobStatus,
    default: ScrapeJobStatus.ACTIVE,
  })
  @IsEnum(ScrapeJobStatus, { message: 'Invalid scrape job status' })
  status!: ScrapeJobStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastRun?: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRun?: Date;

  @OneToMany(() => ScrapedData, data => data.scrapeJob)
  scrapedData!: ScrapedData[];

  @OneToMany(() => ScrapeLog, log => log.scrapeJob)
  scrapeLogs!: ScrapeLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index() // Index for faster lookups by userId and status
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean = false;
}