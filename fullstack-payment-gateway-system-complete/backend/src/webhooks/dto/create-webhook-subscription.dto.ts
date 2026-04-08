import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsUrl, MaxLength } from 'class-validator';
import { WebhookEventType } from '../../database/entities/webhook-subscription.entity';

export class CreateWebhookSubscriptionDto {
  @ApiProperty({ example: 'https://your-merchant.com/webhook-listener', description: 'URL to send webhook events to' })
  @IsUrl()
  @MaxLength(2048)
  @IsNotEmpty()
  callbackUrl: string;

  @ApiProperty({
    example: [WebhookEventType.TRANSACTION_CAPTURED, WebhookEventType.TRANSACTION_REFUNDED],
    description: 'Array of event types to subscribe to',
    enum: WebhookEventType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  eventTypes: WebhookEventType[];
}