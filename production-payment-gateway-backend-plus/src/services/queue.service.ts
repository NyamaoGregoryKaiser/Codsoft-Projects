```typescript
// This service simulates a message queue, potentially using Redis Streams or a dedicated library like BullMQ.
// For simplicity, this example uses a basic in-memory array for demonstration,
// but in production, it would be backed by Redis or another robust queueing system.

import logger from "../config/logger";
import { getRedisClient } from "./cache.service";
import config from "../config";
import axios from "axios";
import { WebhookDeliveryStatus, WebhookEvent, WebhookEventType } from "../entities/WebhookEvent";
import { AppDataSource } from "../database/data-source";
import { Repository } from "typeorm";
import { Merchant } from "../entities/Merchant";

interface QueueTask {
  id: string;
  eventType: WebhookEventType;
  payload: any;
  targetUrl: string;
  merchantId: string;
  webhookEventId: string; // Link to the WebhookEvent entity for status updates
  retryAttempts: number;
  nextAttemptAt: Date;
}

// In-memory queue for demonstration. Replace with Redis Stream, BullMQ etc. in production.
const webhookQueue: QueueTask[] = [];
let queueProcessorInterval: NodeJS.Timeout | null = null;

const webhookEventRepository: Repository<WebhookEvent> = AppDataSource.getRepository(WebhookEvent);
const merchantRepository: Repository<Merchant> = AppDataSource.getRepository(Merchant);


export const addWebhookToQueue = async (
  eventType: WebhookEventType,
  payload: any,
  targetUrl: string,
  merchantId: string
): Promise<void> => {
  const newWebhookEvent = webhookEventRepository.create({
    eventType,
    targetUrl,
    payload,
    merchant: await merchantRepository.findOneByOrFail({ id: merchantId }),
    deliveryStatus: WebhookDeliveryStatus.PENDING,
    retryAttempts: 0,
    nextAttemptAt: new Date(),
  });
  await webhookEventRepository.save(newWebhookEvent);

  const task: QueueTask = {
    id: newWebhookEvent.id, // Use webhookEventId as task ID
    eventType,
    payload,
    targetUrl,
    merchantId,
    webhookEventId: newWebhookEvent.id,
    retryAttempts: 0,
    nextAttemptAt: new Date(),
  };

  webhookQueue.push(task);
  logger.info(`Added webhook event ${task.webhookEventId} (${eventType}) to queue. Target: ${targetUrl}`);

  // In a real Redis-backed queue, you would push to Redis:
  // await getRedisClient().lPush('webhook_queue', JSON.stringify(task));
};

const processQueue = async () => {
  const now = new Date();
  const tasksToProcess = webhookQueue.filter(task => task.nextAttemptAt <= now);

  for (const task of tasksToProcess) {
    // Remove task from pending queue to process
    const index = webhookQueue.indexOf(task);
    if (index > -1) {
      webhookQueue.splice(index, 1);
    }

    logger.debug(`Processing webhook task ${task.webhookEventId}, attempt ${task.retryAttempts + 1}`);
    let webhookEvent: WebhookEvent | null = null;
    try {
      webhookEvent = await webhookEventRepository.findOneBy({ id: task.webhookEventId });
      if (!webhookEvent) {
        logger.warn(`WebhookEvent ${task.webhookEventId} not found in DB. Skipping task.`);
        continue;
      }

      webhookEvent.deliveryStatus = WebhookDeliveryStatus.RETRYING;
      webhookEvent.lastAttemptedAt = new Date();
      await webhookEventRepository.save(webhookEvent);


      const response = await axios.post(task.targetUrl, task.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': task.eventType,
          // Add signature header in production for verification
          // 'X-Webhook-Signature': generateSignature(task.payload, config.WEBHOOK_SECRET)
        },
        timeout: 5000, // 5 second timeout for webhook delivery
      });

      // Webhook delivered successfully
      webhookEvent.deliveryStatus = WebhookDeliveryStatus.SENT;
      webhookEvent.responseCode = response.status;
      webhookEvent.responseBody = JSON.stringify(response.data);
      await webhookEventRepository.save(webhookEvent);
      logger.info(`Webhook ${task.webhookEventId} (${task.eventType}) successfully delivered to ${task.targetUrl}. Status: ${response.status}`);

    } catch (error: any) {
      // Webhook delivery failed
      logger.error(`Webhook ${task.webhookEventId} (${task.eventType}) failed to deliver to ${task.targetUrl}: ${error.message}`);

      if (webhookEvent) {
        webhookEvent.retryAttempts = task.retryAttempts + 1;
        webhookEvent.responseCode = error.response?.status || 0;
        webhookEvent.responseBody = JSON.stringify(error.response?.data || { message: error.message });
      }

      if (task.retryAttempts < config.WEBHOOK_MAX_RETRIES) {
        const nextDelay = config.WEBHOOK_RETRY_DELAY_MS * Math.pow(2, task.retryAttempts); // Exponential backoff
        const nextAttempt = new Date(now.getTime() + nextDelay);
        const retryTask = { ...task, retryAttempts: task.retryAttempts + 1, nextAttemptAt: nextAttempt };

        webhookQueue.push(retryTask); // Add back to queue for retry
        if (webhookEvent) {
          webhookEvent.deliveryStatus = WebhookDeliveryStatus.RETRYING;
          webhookEvent.nextAttemptAt = nextAttempt;
          await webhookEventRepository.save(webhookEvent);
        }
        logger.warn(`Webhook ${task.webhookEventId} will be retried at ${nextAttempt.toISOString()}`);
      } else {
        // Max retries exhausted
        if (webhookEvent) {
          webhookEvent.deliveryStatus = WebhookDeliveryStatus.FAILED;
          await webhookEventRepository.save(webhookEvent);
        }
        logger.error(`Webhook ${task.webhookEventId} (${task.eventType}) failed after ${config.WEBHOOK_MAX_RETRIES} retries.`);
        // Potentially move to a Dead Letter Queue (DLQ)
      }
    }
  }
};

export const initializeQueue = (intervalMs: number = 5000) => {
  if (queueProcessorInterval) {
    clearInterval(queueProcessorInterval);
  }
  queueProcessorInterval = setInterval(processQueue, intervalMs);
  logger.info(`Webhook queue processor initialized with interval: ${intervalMs}ms`);
};

export const stopQueue = () => {
  if (queueProcessorInterval) {
    clearInterval(queueProcessorInterval);
    queueProcessorInterval = null;
    logger.info("Webhook queue processor stopped.");
  }
};
```