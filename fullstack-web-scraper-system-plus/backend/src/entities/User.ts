import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsEmail, Length, IsEnum } from 'class-validator';
import { ScrapeJob } from './ScrapeJob';
import { UserRole } from '../types/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @Column({ select: false }) // Password hash won't be loaded by default
  @Length(60, 60, { message: 'Password hash must be 60 characters long' }) // bcrypt hash length
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role!: UserRole;

  @OneToMany(() => ScrapeJob, job => job.user)
  scrapeJobs!: ScrapeJob[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}