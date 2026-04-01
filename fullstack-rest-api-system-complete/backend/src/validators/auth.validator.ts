import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { IsUnique } from './custom.validator';
import { User } from '../models/User.entity';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  @IsUnique(User, 'email', { message: 'Email already in use' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255)
  password!: string;

  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(100)
  lastName!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}