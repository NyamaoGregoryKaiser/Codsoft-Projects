import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscription } from '../database/entities/webhook-subscription.entity';
import { WebhookAttempt } from '../database/entities/webhook-attempt.entity';
import { WebhookSubscriptionsController } from './webhook-subscriptions.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MerchantsModule } from '../merchants/merchants.module';
import { AppLogger } from '../common/logger/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookSubscription, WebhookAttempt]),
    HttpModule,
    ConfigModule,
    MerchantsModule, // Needed to validate merchant for subscriptions
  ],
  controllers: [WebhookSubscriptionsController],
  providers: [WebhooksService, AppLogger], // AppLogger manually included since it's global
  exports: [WebhooksService],
})
export class WebhooksModule {}