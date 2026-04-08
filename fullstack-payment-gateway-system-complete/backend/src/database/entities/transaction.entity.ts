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
import { User } from './user.entity';
import { PaymentMethod } from './payment-method.entity';
import { WebhookAttempt } from './webhook-attempt.entity';

export enum TransactionType {
  CHARGE = 'charge',
  REFUND = 'refund',
  VOID = 'void',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CAPTURED = 'captured',
  REFUNDED = 'refunded',
  VOIDED = 'voided',
  FAILED = 'failed',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.transactions)
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column()
  merchantId: string;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  paymentMethodId: string;

  @ManyToOne(() => User, (user) => user.transactions, { nullable: true })
  @JoinColumn({ name: 'processedById' })
  processedBy: User; // User who initiated the transaction

  @Column({ nullable: true })
  processedById: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ length: 3 })
  currency: string; // e.g., USD, EUR

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  // External ID from the actual payment gateway (e.g., Stripe Charge ID)
  @Column({ nullable: true })
  gatewayTransactionId: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, type: 'jsonb' })
  metadata: object; // Arbitrary data for merchant

  @OneToMany(() => WebhookAttempt, (attempt) => attempt.transaction)
  webhookAttempts: WebhookAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}