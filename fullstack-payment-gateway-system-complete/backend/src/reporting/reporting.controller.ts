import { Controller, Get, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { Request } from 'express';
import { IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class DateRangeQueryDto {
  @ApiProperty({
    description: 'Start date for the report (ISO 8601 format)',
    required: false,
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the report (ISO 8601 format)',
    required: false,
    example: '2023-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@ApiTags('Reporting')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get a summary of transactions for the authenticated merchant' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Transaction summary.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getSummary(@Req() req: Request, @Query() dateRange: DateRangeQueryDto) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Reporting is only available for merchants.');
    }
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : undefined;
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : undefined;
    return this.reportingService.getTransactionSummary(req.user['merchantId'], startDate, endDate);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily transaction breakdown for the authenticated merchant' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Daily transaction data.' })
  @ApiResponse({ status: 400, description: 'Bad Request (missing date range).' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getDailyTransactions(@Req() req: Request, @Query() dateRange: DateRangeQueryDto) {
    if (!req.user['merchantId']) {
      throw new ForbiddenException('Reporting is only available for merchants.');
    }
    if (!dateRange.startDate || !dateRange.endDate) {
      throw new BadRequestException('startDate and endDate are required for daily reporting.');
    }
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    return this.reportingService.getDailyTransactions(req.user['merchantId'], startDate, endDate);
  }
}