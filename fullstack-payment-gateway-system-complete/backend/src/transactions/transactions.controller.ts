import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RefundTransactionDto } from './dto/refund-transaction.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { Request } from 'express';
import { Transaction } from '../database/entities/transaction.entity';
import { PaginatedResponseDto } from '../common/dto/base-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { HttpCacheInterceptor } from '../common/interceptors/cache.interceptor';
import { UseInterceptors, CacheKey, CacheTTL } from '@nestjs/common';

class TransactionPaginatedResponseDto extends PaginatedResponseDto<Transaction> {}

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('charge')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Create a new charge transaction' })
  @ApiResponse({ status: 201, description: 'Charge transaction initiated successfully.', type: Transaction })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createCharge(@Req() req: Request, @Body() createTransactionDto: CreateTransactionDto) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can create transactions.');
    }
    return this.transactionsService.createCharge(
      createTransactionDto,
      req.user['merchantId'],
      req.user['userId'],
    );
  }

  @Patch(':id/refund')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Refund an existing transaction' })
  @ApiResponse({ status: 200, description: 'Transaction refunded successfully.', type: Transaction })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async refundTransaction(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() refundTransactionDto: RefundTransactionDto,
  ) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can refund transactions.');
    }
    return this.transactionsService.refundTransaction(
      id,
      req.user['merchantId'],
      req.user['userId'],
      refundTransactionDto.amount,
    );
  }

  @Patch(':id/void')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Void a pending transaction' })
  @ApiResponse({ status: 200, description: 'Transaction voided successfully.', type: Transaction })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async voidTransaction(@Req() req: Request, @Param('id') id: string) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can void transactions.');
    }
    return this.transactionsService.voidTransaction(
      id,
      req.user['merchantId'],
      req.user['userId'],
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @UseInterceptors(HttpCacheInterceptor) // Cache responses for a shorter period for lists
  @CacheTTL(30) // Cache for 30 seconds
  @ApiOperation({ summary: 'Retrieve all transactions for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'List of transactions.', type: TransactionPaginatedResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findAll(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can view transactions.');
    }
    const [transactions, totalItems] = await this.transactionsService.findAll(
      req.user['merchantId'],
      paginationDto.page,
      paginationDto.limit,
    );

    const totalPages = Math.ceil(totalItems / paginationDto.limit);

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalItems,
      totalPages,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @UseInterceptors(HttpCacheInterceptor) // Cache individual transaction details
  @CacheTTL(60) // Cache for 1 minute
  @ApiOperation({ summary: 'Retrieve a transaction by ID for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'The found transaction.', type: Transaction })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Only merchant users can view transactions.');
    }
    return this.transactionsService.findOne(id, req.user['merchantId']);
  }
}