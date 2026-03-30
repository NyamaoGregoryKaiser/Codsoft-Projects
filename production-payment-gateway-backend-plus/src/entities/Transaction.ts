```typescript
import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Merchant } from "./Merchant";
import { Refund } from "./Refund";

export enum TransactionStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
  CANCELLED = "CANCELLED",
}

export enum TransactionType {
  SALE = "SALE",
  AUTHORIZATION = "AUTHORIZATION", // If we implement auth/capture
}

@Entity()
export class Transaction extends BaseEntity {
  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 3 })
  currency!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Column({ type: "enum", enum: TransactionType })
  type!: TransactionType;

  @Column({ nullable: true })
  gatewayReference!: string; // Reference ID from the external payment gateway

  @Column({ nullable: true })
  customerIdentifier!: string; // e.g., customer_id from merchant's system

  @Column({ type: "timestamp", nullable: true })
  processedAt!: Date;

  @Column({ nullable: true })
  callbackUrl!: string; // URL provided by merchant for this specific transaction's webhook

  @ManyToOne(() => Merchant, (merchant) => merchant.transactions, { onDelete: 'CASCADE' })
  merchant!: Merchant;

  @OneToMany(() => Refund, (refund) => refund.transaction)
  refunds!: Refund[];
}
```