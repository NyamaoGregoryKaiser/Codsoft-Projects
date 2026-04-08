import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMerchantDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Unique name of the merchant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'contact@acmecorp.com', description: 'Contact email for the merchant', required: false })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ example: true, description: 'Whether the merchant is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}