```typescript
import { Entity, Column, OneToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";
import { Transaction } from "./Transaction";
import { WebhookEvent } from "./WebhookEvent";

@Entity()
export class Merchant extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  apiKey!: string; // For API access, should be generated and managed securely

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  contactEmail!: string;

  // Link to the user who owns/registered this merchant account
  @OneToOne(() => User, user => user.merchant, { cascade: true, eager: true }) // eager to fetch user with merchant
  ownerUser!: User;

  @OneToMany(() => Transaction, transaction => transaction.merchant)
  transactions!: Transaction[];

  @OneToMany(() => WebhookEvent, webhookEvent => webhookEvent.merchant)
  webhookEvents!: WebhookEvent[];
}
```