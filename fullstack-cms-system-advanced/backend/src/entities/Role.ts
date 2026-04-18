import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './User';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, nullable: false })
  name!: string; // e.g., 'admin', 'editor', 'viewer'

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}