```typescript
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Comment content is required' })
  @IsString({ message: 'Comment content must be a string' })
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content!: string;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsString({ message: 'Comment content must be a string' })
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content?: string;
}

// DTO for task ID parameter validation (parent route)
export class TaskIdParamDto {
  @IsUUID('4', { message: 'Invalid task ID format' })
  taskId!: string;
}

// DTO for comment ID parameter validation
export class CommentIdParamDto {
  @IsUUID('4', { message: 'Invalid comment ID format' })
  commentId!: string;
}

// DTO for comment list query parameters
export class CommentListQueryDto {
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

// DTO for Comment Response (simplified)
export class CommentResponseDto {
  id!: string;
  content!: string;
  user!: { id: string; firstName: string; lastName: string; email: string };
  task!: { id: string; title: string };
  createdAt!: Date;
  updatedAt!: Date;
}
```