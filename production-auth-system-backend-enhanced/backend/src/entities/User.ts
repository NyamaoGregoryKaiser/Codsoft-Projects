import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from './RefreshToken';
import bcrypt from 'bcryptjs';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string; // Hashed password

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshToken[];

  /**
   * Hashes the user's password before saving.
   * @param password - The plain text password.
   * @returns The hashed password.
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a given password with the stored hashed password.
   * @param password - The plain text password to compare.
   * @returns True if passwords match, false otherwise.
   */
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}