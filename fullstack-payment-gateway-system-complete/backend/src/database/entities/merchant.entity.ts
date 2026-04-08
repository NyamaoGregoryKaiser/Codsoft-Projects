import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';
import { WebhookSubscription } from './webhook-subscription.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ default: true })
  isActive: boolean;

  // API Key for our system to identify the merchant
  @Column({ unique: true, nullable: true })
  apiKey: string;

  // API Secret for authenticating requests from the merchant
  @Column({ unique: true, nullable: true })
  apiSecret: string;

  @OneToMany(() => User, (user) => user.merchant)
  users: User[];

  @OneToMany(() => Transaction, (transaction) => transaction.merchant)
  transactions: Transaction[];

  @OneToMany(() => WebhookSubscription, (subscription) => subscription.merchant)
  webhookSubscriptions: WebhookSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}