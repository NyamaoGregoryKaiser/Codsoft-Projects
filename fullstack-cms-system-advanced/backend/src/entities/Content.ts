import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { Tag } from './Tag';

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('content')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false })
  title!: string;

  @Column({ unique: true, nullable: false })
  slug!: string;

  @Column('text', { nullable: false })
  body!: string;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status!: ContentStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @ManyToOne(() => User, (user) => user.content, { nullable: false, onDelete: 'CASCADE' })
  author!: User;

  @ManyToOne(() => Category, (category) => category.content, { nullable: true, onDelete: 'SET NULL', eager: true })
  category?: Category;

  @ManyToMany(() => Tag, (tag) => tag.content, { eager: true })
  @JoinTable({ name: 'content_tags' })
  tags!: Tag[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}