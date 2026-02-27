```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: [UserRole.User, UserRole.Admin],
    description: 'Roles assigned to the user (only modifiable by Admin)',
    enum: UserRole,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { each: true, message: 'Invalid user role provided in roles array' })
  roles?: UserRole[]; // Make roles an array
}
```