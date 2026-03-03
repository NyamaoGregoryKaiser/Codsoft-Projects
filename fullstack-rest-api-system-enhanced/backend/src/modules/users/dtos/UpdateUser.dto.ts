import { IsOptional, IsString, MaxLength, IsEnum, IsEmail } from 'class-validator';
import { UserRole } from '../../../database/entities/User';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name cannot be longer than 100 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name cannot be longer than 100 characters' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole;
}