import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'newuser@example.com', description: 'Email of the new user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepassword', description: 'Password for the new user' })
  @IsString()
  @MinLength(6)
  password: string;

  // Internal field, not directly exposed for API input in most cases, handled by service
  passwordHash?: string;

  @ApiProperty({
    example: UserRole.MERCHANT_USER,
    description: 'Role of the user',
    enum: UserRole,
    default: UserRole.MERCHANT_USER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.MERCHANT_USER;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'ID of the merchant this user belongs to',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  merchantId?: string;
}