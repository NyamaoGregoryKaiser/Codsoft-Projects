import { ApiProperty } from '@nestjs/swagger';
import {
  IsDecimal,
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 100.50, description: 'Amount of the transaction in decimal format' })
  @IsNumberString({ locale: 'en-US' }) // Use IsNumberString for decimal numbers from payload
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid currency format with up to 2 decimal places' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: string; // Use string for amount to avoid floating point precision issues

  @ApiProperty({ example: 'USD', description: 'Currency code (e.g., USD, EUR, GBP)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  currency: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'ID of the payment method to use for the transaction',
  })
  @IsUUID()
  paymentMethodId: string;

  @ApiProperty({ example: 'customer@example.com', description: 'Email of the customer', required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ example: 'John Doe', description: 'Name of the customer', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: 'Purchase of product X', description: 'Description of the transaction', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: 'object', example: { orderId: 'ORD-123', customField: 'value' }, description: 'Arbitrary metadata for the transaction', required: false })
  @IsOptional()
  metadata?: object;
}