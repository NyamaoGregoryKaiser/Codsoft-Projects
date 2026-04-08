export enum WebhookEventType {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_UPDATED = 'transaction.updated',
  TRANSACTION_FAILED = 'transaction.failed',
  TRANSACTION_CAPTURED = 'transaction.captured',
  TRANSACTION_REFUNDED = 'transaction.refunded',
  TRANSACTION_VOIDED = 'transaction.voided',
}

export interface WebhookSubscription {
  id: string;
  merchantId: string;
  callbackUrl: string;
  eventTypes: WebhookEventType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookSubscriptionDto {
  callbackUrl: string;
  eventTypes: WebhookEventType[];
}

export interface UpdateWebhookSubscriptionDto extends Partial<CreateWebhookSubscriptionDto> {
  isActive?: boolean;
}