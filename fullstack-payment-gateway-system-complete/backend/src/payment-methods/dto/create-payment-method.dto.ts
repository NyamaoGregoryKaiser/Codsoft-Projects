import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { PaymentMethodType } from '../../database/entities/payment-method.entity';

export class CreatePaymentMethodDto {
  @ApiProperty({
    example: PaymentMethodType.CREDIT_CARD,
    description: 'Type of payment method',
    enum: PaymentMethodType,
  })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @ApiProperty({
    example: 'tok_visa_mock',
    description: 'Tokenized representation from a payment gateway (simulated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  gatewayToken?: string;

  @ApiProperty({ example: 'Visa', description: 'Brand of the card', required: false })
  @IsOptional()
  @IsString()
  cardBrand?: string;

  @ApiProperty({ example: '4242', description: 'Last 4 digits of the card number', required: false })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  last4?: string;

  @ApiProperty({ example: 12, description: 'Expiration month of the card', required: false, minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  expiryMonth?: number;

  @ApiProperty({ example: 2025, description: 'Expiration year of the card', required: false, minimum: 2000 })
  @IsOptional()
  @IsInt()
  @Min(new Date().getFullYear()) // Ensure year is not in the past relative to current year
  expiryYear?: number;

  @ApiProperty({ example: 'fingerprint_abc123', description: 'Unique identifier for the payment method by gateway', required: false })
  @IsOptional()
  @IsString()
  fingerprint?: string;

  @ApiProperty({ example: true, description: 'Whether this payment method is the default for the merchant', required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}