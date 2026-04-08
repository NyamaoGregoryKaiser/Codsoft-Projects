import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, Matches, Min } from 'class-validator';

export class RefundTransactionDto {
  @ApiProperty({
    example: 50.00,
    description: 'Optional: Amount to refund. If not provided, the full remaining amount will be refunded.',
    required: false,
  })
  @IsOptional()
  @IsNumberString({ locale: 'en-US' })
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid currency format with up to 2 decimal places' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount?: string; // Use string for amount to avoid floating point precision issues
}