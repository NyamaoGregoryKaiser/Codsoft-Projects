import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { WebhookSubscription, WebhookEventType } from './webhook-subscription.entity';

export enum WebhookAttemptStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('webhook_attempts')
export class WebhookAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WebhookSubscription, (subscription) => subscription.webhookAttempts)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: WebhookSubscription;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.webhookAttempts, {
    nullable: true,
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'enum', enum: WebhookEventType })
  eventType: WebhookEventType;

  @Column({ type: 'jsonb' })
  payload: object;

  @Column()
  url: string;

  @Column({ type: 'enum', enum: WebhookAttemptStatus, default: WebhookAttemptStatus.PENDING })
  status: WebhookAttemptStatus;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ nullable: true, type: 'text' })
  responseBody: string;

  @Column({ type: 'int', default: 0 })
  retries: number;

  @CreateDateColumn()
  createdAt: Date;
}