import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsString, MinLength, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'newsecurepassword', description: 'New password for the user', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  // Override role to be optional for update and allow change
  @ApiProperty({
    example: UserRole.ADMIN,
    description: 'New role for the user',
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'New merchant ID if reassigning user',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  merchantId?: string;
}