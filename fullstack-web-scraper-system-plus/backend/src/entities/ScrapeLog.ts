import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { ScrapeJob } from './ScrapeJob';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { LogLevel } from '../types/enums';

@Entity('scrape_logs')
export class ScrapeLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ScrapeJob, job => job.scrapeLogs, { onDelete: 'CASCADE' })
  scrapeJob!: ScrapeJob;

  @Column({ name: 'jobId' }) // Explicit column for foreign key
  jobId!: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  @IsEnum(LogLevel)
  level!: LogLevel;

  @CreateDateColumn()
  @Index() // Index for faster lookups by timestamp and jobId
  timestamp!: Date;
}