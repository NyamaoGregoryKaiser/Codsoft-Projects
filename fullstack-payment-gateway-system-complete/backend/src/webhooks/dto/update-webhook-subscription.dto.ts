import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateWebhookSubscriptionDto } from './create-webhook-subscription.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWebhookSubscriptionDto extends PartialType(CreateWebhookSubscriptionDto) {
  @ApiProperty({ example: true, description: 'Whether the subscription is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}