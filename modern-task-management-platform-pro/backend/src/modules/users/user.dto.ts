```typescript
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsEnum, IsUUID } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(255)
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255)
  password?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'Invalid role provided' })
  role!: UserRole;
}

// DTO for user ID parameter validation
export class UserIdParamDto {
  @IsUUID('4', { message: 'Invalid user ID format' })
  id!: string;
}

// DTO for user response (excluding password)
export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}

export class UserListQueryDto {
  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC', 'asc', 'desc'])
  orderDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
}
```