```typescript
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Awesome Project', description: 'Title of the project' })
  @IsNotEmpty({ message: 'Title should not be empty' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(100, { message: 'Title must be at most 100 characters long' })
  title: string;

  @ApiProperty({ example: 'A detailed description of the project goals.', description: 'Description of the project', required: false })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must be at most 500 characters long' })
  description?: string;
}
```