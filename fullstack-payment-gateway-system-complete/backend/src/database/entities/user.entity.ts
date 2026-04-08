import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Merchant } from './merchant.entity';
import { Transaction } from './transaction.entity';

export enum UserRole {
  ADMIN = 'admin',
  MERCHANT_USER = 'merchant_user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string; // Store hashed password

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MERCHANT_USER })
  role: UserRole;

  @ManyToOne(() => Merchant, (merchant) => merchant.users, { nullable: true })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column({ nullable: true })
  merchantId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.processedBy)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}