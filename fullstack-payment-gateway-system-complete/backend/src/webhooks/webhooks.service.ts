import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookSubscription, WebhookEventType } from '../database/entities/webhook-subscription.entity';
import { WebhookAttempt, WebhookAttemptStatus } from '../database/entities/webhook-attempt.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class WebhooksService {
  private readonly webhookSigningSecret: string;
  constructor(
    @InjectRepository(WebhookSubscription)
    private webhookSubscriptionRepository: Repository<WebhookSubscription>,
    @InjectRepository(WebhookAttempt)
    private webhookAttemptRepository: Repository<WebhookAttempt>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly appLogger: AppLogger,
  ) {
    this.webhookSigningSecret = this.configService.get<string>('WEBHOOK_SIGNING_SECRET');
  }

  // --- Subscription Management (used by WebhookSubscriptionsController) ---

  async createSubscription(merchantId: string, callbackUrl: string, eventTypes: WebhookEventType[]): Promise<WebhookSubscription> {
    this.appLogger.debug(`Creating webhook subscription for merchant ${merchantId} to URL ${callbackUrl}`, WebhooksService.name);
    const existing = await this.webhookSubscriptionRepository.findOneBy({ merchantId, callbackUrl });
    if (existing) {
        throw new Error('Subscription to this URL already exists for this merchant.');
    }
    const subscription = this.webhookSubscriptionRepository.create({
      merchantId,
      callbackUrl,
      eventTypes,
      isActive: true,
    });
    return this.webhookSubscriptionRepository.save(subscription);
  }

  async findSubscriptions(merchantId: string): Promise<WebhookSubscription[]> {
    this.appLogger.debug(`Finding webhook subscriptions for merchant ${merchantId}`, WebhooksService.name);
    return this.webhookSubscriptionRepository.find({ where: { merchantId, isActive: true } });
  }

  async updateSubscription(id: string, merchantId: string, callbackUrl: string, eventTypes: WebhookEventType[], isActive: boolean): Promise<WebhookSubscription> {
    this.appLogger.debug(`Updating webhook subscription ${id} for merchant ${merchantId}`, WebhooksService.name);
    const subscription = await this.webhookSubscriptionRepository.findOneBy({ id, merchantId });
    if (!subscription) {
      throw new NotFoundException(`Webhook subscription with ID ${id} not found for this merchant.`);
    }
    subscription.callbackUrl = callbackUrl;
    subscription.eventTypes = eventTypes;
    subscription.isActive = isActive;
    return this.webhookSubscriptionRepository.save(subscription);
  }

  async deleteSubscription(id: string, merchantId: string): Promise<void> {
    this.appLogger.debug(`Deleting webhook subscription ${id} for merchant ${merchantId}`, WebhooksService.name);
    const result = await this.webhookSubscriptionRepository.delete({ id, merchantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Webhook subscription with ID ${id} not found for this merchant.`);
    }
  }

  // --- Webhook Dispatching ---

  async dispatchWebhook(
    merchantId: string,
    eventType: WebhookEventType,
    transaction: Transaction,
    additionalPayload?: object,
  ): Promise<void> {
    this.appLogger.log(`Attempting to dispatch webhook for event ${eventType} for transaction ${transaction.id} and merchant ${merchantId}`, WebhooksService.name);
    const subscriptions = await this.webhookSubscriptionRepository.find({
      where: {
        merchantId,
        isActive: true,
      },
    });

    for (const subscription of subscriptions) {
      if (subscription.eventTypes.includes(eventType)) {
        const payload = {
          eventType: eventType,
          timestamp: new Date().toISOString(),
          data: {
            transaction: transaction,
            ...additionalPayload,
          },
        };
        await this.sendWebhook(subscription, payload, transaction.id);
      }
    }
  }

  private async sendWebhook(
    subscription: WebhookSubscription,
    payload: object,
    transactionId: string,
    retryCount = 0,
  ): Promise<void> {
    const payloadString = JSON.stringify(payload);
    const signature = this.generateWebhookSignature(payloadString);

    const webhookAttempt = this.webhookAttemptRepository.create({
      subscription: subscription,
      subscriptionId: subscription.id,
      transactionId: transactionId,
      eventType: payload['eventType'],
      payload: payload,
      url: subscription.callbackUrl,
      retries: retryCount,
    });

    try {
      this.appLogger.debug(`Sending webhook to ${subscription.callbackUrl} for event ${payload['eventType']} (retry: ${retryCount})`, WebhooksService.name);
      const response = await firstValueFrom(
        this.httpService.post(subscription.callbackUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': signature, // Custom header for webhook signature
          },
          timeout: 5000, // 5 second timeout for webhooks
        }),
      );

      webhookAttempt.status = WebhookAttemptStatus.SUCCESS;
      webhookAttempt.statusCode = response.status;
      webhookAttempt.responseBody = JSON.stringify(response.data);
      this.appLogger.log(`Webhook to ${subscription.callbackUrl} succeeded with status ${response.status}`, WebhooksService.name);
    } catch (error) {
      webhookAttempt.status = WebhookAttemptStatus.FAILED;
      webhookAttempt.statusCode = error.response?.status || 0;
      webhookAttempt.responseBody = JSON.stringify(error.response?.data || error.message);
      this.appLogger.error(`Webhook to ${subscription.callbackUrl} failed: ${error.message}`, error.stack, WebhooksService.name);

      // Simple retry logic (e.g., up to 3 retries)
      if (retryCount < 2) { // Total 3 attempts (initial + 2 retries)
        setTimeout(() => this.sendWebhook(subscription, payload, transactionId, retryCount + 1), 5000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      await this.webhookAttemptRepository.save(webhookAttempt);
    }
  }

  private generateWebhookSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.webhookSigningSecret)
      .update(payload)
      .digest('hex');
  }
}