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
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { Request } from 'express';
import { PaymentMethod } from '../database/entities/payment-method.entity';

@ApiTags('Payment Methods')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Create a new payment method for the authenticated merchant' })
  @ApiResponse({ status: 201, description: 'Payment method created successfully.', type: PaymentMethod })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Req() req: Request, @Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can create payment methods.');
    }
    return this.paymentMethodsService.create(createPaymentMethodDto, req.user['merchantId']);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Retrieve all payment methods for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'List of payment methods.', type: [PaymentMethod] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findAll(@Req() req: Request) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can view payment methods.');
    }
    return this.paymentMethodsService.findAll(req.user['merchantId']);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Retrieve a payment method by ID for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'The found payment method.', type: PaymentMethod })
  @ApiResponse({ status: 404, description: 'Payment method not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can view payment methods.');
    }
    return this.paymentMethodsService.findOne(id, req.user['merchantId']);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Update a payment method by ID for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'Payment method updated successfully.', type: PaymentMethod })
  @ApiResponse({ status: 404, description: 'Payment method not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() updatePaymentMethodDto: UpdatePaymentMethodDto) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can update payment methods.');
    }
    return this.paymentMethodsService.update(id, req.user['merchantId'], updatePaymentMethodDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Deactivate a payment method by ID for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'Payment method deactivated successfully.' })
  @ApiResponse({ status: 404, description: 'Payment method not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can delete (deactivate) payment methods.');
    }
    await this.paymentMethodsService.remove(id, req.user['merchantId']);
    return { message: 'Payment method deactivated successfully' };
  }
}