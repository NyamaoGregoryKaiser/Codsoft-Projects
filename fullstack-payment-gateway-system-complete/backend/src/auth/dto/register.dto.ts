import { ApiProperty, PartialType } from '@nestjs/swagger';
import { LoginDto } from './login.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class RegisterDto extends PartialType(LoginDto) {
  @ApiProperty({
    example: UserRole.MERCHANT_USER,
    description: 'Role of the user (defaults to merchant_user)',
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.MERCHANT_USER;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'ID of the merchant this user belongs to (required for merchant_user role)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  merchantId?: string;
}