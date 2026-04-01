import { IsString, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content!: string;

  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;
}

export class UpdateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content!: string;
}