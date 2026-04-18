import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false })
  fileName!: string;

  @Column({ nullable: false })
  originalName!: string;

  @Column({ nullable: false })
  mimeType!: string;

  @Column({ nullable: false })
  url!: string; // URL to access the stored file

  @Column({ nullable: true })
  size?: number; // File size in bytes

  @ManyToOne(() => User, (user) => user.media, { nullable: true, onDelete: 'SET NULL' })
  owner?: User; // User who uploaded the media

  @CreateDateColumn()
  uploadedAt!: Date;
}