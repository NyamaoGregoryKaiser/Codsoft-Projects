import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Role } from './Role';
import { Content } from './Content';
import { Media } from './Media';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: false })
  password!: string; // Hashed password

  @Column({ nullable: false, default: 'Anonymous' })
  firstName!: string;

  @Column({ nullable: false, default: 'User' })
  lastName!: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true, nullable: false })
  role!: Role;

  @OneToMany(() => Content, (content) => content.author)
  content!: Content[];

  @OneToMany(() => Media, (media) => media.owner)
  media!: Media[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}