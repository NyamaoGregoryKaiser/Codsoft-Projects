import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../shared/enums/roles.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Unique username for the user' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Unique email address for the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password (minimum 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ description: 'Roles assigned to the user', enum: Role, isArray: true, default: [Role.User] })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];
}

export class UpdateUserDto {
  @ApiProperty({ description: 'Updated username', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({ description: 'Updated email address', required: false })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({ description: 'Updated password (minimum 6 characters)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiProperty({ description: 'Updated roles for the user', enum: Role, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];
}