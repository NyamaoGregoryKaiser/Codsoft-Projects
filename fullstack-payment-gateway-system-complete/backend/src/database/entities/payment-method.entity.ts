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

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  BANK_ACCOUNT = 'bank_account',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}

// This entity stores abstracted/tokenized payment method details,
// NOT raw sensitive card data (PCI compliance is out of scope for this example).
@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.id, { nullable: true })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column({ nullable: true })
  merchantId: string; // If this PM is specific to a merchant

  @Column({ type: 'enum', enum: PaymentMethodType })
  type: PaymentMethodType;

  // Token from a real payment gateway (e.g., Stripe Token ID)
  // For this simulated system, it's just a mock token.
  @Column({ nullable: true })
  gatewayToken: string;

  // Card details (last 4 digits only for display/identification)
  @Column({ nullable: true })
  cardBrand: string; // e.g., Visa, Mastercard, Amex

  @Column({ nullable: true, length: 4 })
  last4: string;

  @Column({ nullable: true, type: 'int' })
  expiryMonth: number;

  @Column({ nullable: true, type: 'int' })
  expiryYear: number;

  // A unique identifier for the payment method from the gateway,
  // useful for recurring payments or identifying existing methods.
  @Column({ unique: true, nullable: true })
  fingerprint: string;

  @Column({ default: true })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Transaction, (transaction) => transaction.paymentMethod)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}