```typescript
import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Merchant } from "./Merchant";

export enum PaymentAccountType {
  BANK_ACCOUNT = "BANK_ACCOUNT",
  CARD = "CARD", // For future expansion, if we store card tokens or details
}

// Represents a merchant's payout account (where they receive funds)
@Entity()
export class PaymentAccount extends BaseEntity {
  @Column({ type: "enum", enum: PaymentAccountType })
  type!: PaymentAccountType;

  @Column()
  accountIdentifier!: string; // e.g., masked bank account number, token

  @Column({ nullable: true })
  bankName!: string;

  @Column({ default: true })
  isDefault!: boolean;

  @ManyToOne(() => Merchant, merchant => merchant.transactions) // Link to merchant
  merchant!: Merchant;
}
```