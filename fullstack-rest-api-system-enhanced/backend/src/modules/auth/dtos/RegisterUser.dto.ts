import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { AuthPayloadDto } from './AuthPayload.dto';

export class RegisterUserDto extends AuthPayloadDto {
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100, { message: 'First name cannot be longer than 100 characters' })
  firstName!: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name cannot be longer than 100 characters' })
  lastName!: string;
}