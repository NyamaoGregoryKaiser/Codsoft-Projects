```typescript
import { PickType } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto extends PickType(RegisterDto, ['email', 'password'] as const) {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  password: string;
}
```