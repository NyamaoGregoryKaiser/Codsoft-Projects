```typescript
import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Transaction } from "./Transaction";

export enum RefundStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

@Entity()
export class Refund extends BaseEntity {
  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 3 })
  currency!: string;

  @Column({
    type: "enum",
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  status!: RefundStatus;

  @Column({ nullable: true })
  gatewayReference!: string; // Reference ID from the external payment gateway for this refund

  @ManyToOne(() => Transaction, (transaction) => transaction.refunds, { onDelete: 'CASCADE' })
  transaction!: Transaction;

  @Column({ type: "timestamp", nullable: true })
  processedAt!: Date;
}
```