```typescript
import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Merchant } from "./Merchant";

export enum WebhookEventType {
  PAYMENT_SUCCEEDED = "payment.succeeded",
  PAYMENT_FAILED = "payment.failed",
  REFUND_SUCCEEDED = "refund.succeeded",
  REFUND_FAILED = "refund.failed",
  // Add more event types as needed
}

export enum WebhookDeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  RETRYING = "RETRYING",
}

// Represents a webhook event sent to a merchant
@Entity()
export class WebhookEvent extends BaseEntity {
  @Column({ type: "enum", enum: WebhookEventType })
  eventType!: WebhookEventType;

  @Column()
  targetUrl!: string; // The URL where the webhook should be sent

  @Column("jsonb")
  payload!: any; // The data payload to send with the webhook

  @Column({
    type: "enum",
    enum: WebhookDeliveryStatus,
    default: WebhookDeliveryStatus.PENDING,
  })
  deliveryStatus!: WebhookDeliveryStatus;

  @Column({ default: 0 })
  retryAttempts!: number;

  @Column({ type: "timestamp", nullable: true })
  lastAttemptedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  nextAttemptAt!: Date;

  @Column({ nullable: true })
  responseCode!: number; // HTTP response code from the target URL

  @Column({ nullable: true })
  responseBody!: string; // Response body from the target URL

  @ManyToOne(() => Merchant, (merchant) => merchant.webhookEvents, { onDelete: 'CASCADE' })
  merchant!: Merchant;
}
```