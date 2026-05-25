import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/User';

@Entity('datasets')
export class Dataset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.datasets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ name: 'file_path' })
  filePath!: string; // Storing path to S3, Google Cloud Storage, or local storage

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes?: number;

  @Column({ name: 'mime_type', nullable: true })
  mimeType?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}