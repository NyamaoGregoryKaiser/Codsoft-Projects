import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterUserDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(30, { message: 'Password must not exceed 30 characters' })
  password!: string;
}

export class LoginUserDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(1, { message: 'Password cannot be empty' }) // For login, we just need to ensure it's not empty, validation against specific length is usually done on registration.
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(30, { message: 'Password must not exceed 30 characters' })
  password!: string;

  @IsString({ message: 'Token must be a string' })
  token!: string;
}