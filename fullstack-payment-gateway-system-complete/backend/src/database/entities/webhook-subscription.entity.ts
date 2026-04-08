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
import { WebhookAttempt } from './webhook-attempt.entity';

export enum WebhookEventType {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_UPDATED = 'transaction.updated',
  TRANSACTION_FAILED = 'transaction.failed',
  TRANSACTION_CAPTURED = 'transaction.captured',
  TRANSACTION_REFUNDED = 'transaction.refunded',
  TRANSACTION_VOIDED = 'transaction.voided',
  // ... potentially more events
}

@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.webhookSubscriptions)
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column()
  merchantId: string;

  @Column()
  callbackUrl: string;

  @Column({
    type: 'enum',
    enum: WebhookEventType,
    array: true,
    default: [WebhookEventType.TRANSACTION_UPDATED],
  })
  eventTypes: WebhookEventType[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => WebhookAttempt, (attempt) => attempt.subscription)
  webhookAttempts: WebhookAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}