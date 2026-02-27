```typescript
import { PickType } from '@nestjs/swagger';
import { RegisterDto } from '../../auth/dto/register.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto extends PickType(RegisterDto, ['name', 'email', 'password'] as const) {
  @ApiProperty({
    example: UserRole.User,
    description: 'Role of the user',
    enum: UserRole,
    default: UserRole.User,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  roles?: UserRole = UserRole.User;
}
```