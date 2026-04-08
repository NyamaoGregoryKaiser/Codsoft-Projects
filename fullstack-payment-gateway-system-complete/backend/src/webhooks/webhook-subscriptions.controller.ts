import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookSubscriptionDto } from './dto/create-webhook-subscription.dto';
import { UpdateWebhookSubscriptionDto } from './dto/update-webhook-subscription.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { Request } from 'express';
import { WebhookSubscription } from '../database/entities/webhook-subscription.entity';

@ApiTags('Webhook Subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('webhook-subscriptions')
export class WebhookSubscriptionsController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Create a new webhook subscription for the authenticated merchant' })
  @ApiResponse({ status: 201, description: 'Webhook subscription created successfully.', type: WebhookSubscription })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Req() req: Request, @Body() createDto: CreateWebhookSubscriptionDto) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can create webhook subscriptions.');
    }
    return this.webhooksService.createSubscription(
      req.user['merchantId'],
      createDto.callbackUrl,
      createDto.eventTypes,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Retrieve all webhook subscriptions for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'List of webhook subscriptions.', type: [WebhookSubscription] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findAll(@Req() req: Request) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can view webhook subscriptions.');
    }
    return this.webhooksService.findSubscriptions(req.user['merchantId']);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Update a webhook subscription by ID for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'Webhook subscription updated successfully.', type: WebhookSubscription })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateDto: UpdateWebhookSubscriptionDto) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can update webhook subscriptions.');
    }
    return this.webhooksService.updateSubscription(
      id,
      req.user['merchantId'],
      updateDto.callbackUrl,
      updateDto.eventTypes,
      updateDto.isActive,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Delete a webhook subscription by ID for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'Webhook subscription deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can delete webhook subscriptions.');
    }
    await this.webhooksService.deleteSubscription(id, req.user['merchantId']);
    return { message: 'Webhook subscription deleted successfully' };
  }
}