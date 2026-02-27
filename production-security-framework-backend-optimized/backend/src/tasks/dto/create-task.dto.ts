```typescript
import { IsNotEmpty, IsString, MaxLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement user authentication', description: 'Title of the task' })
  @IsNotEmpty({ message: 'Title should not be empty' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(100, { message: 'Title must be at most 100 characters long' })
  title: string;

  @ApiProperty({ example: 'Set up JWT, bcrypt, and user login endpoints.', description: 'Description of the task', required: false })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must be at most 500 characters long' })
  description?: string;

  @ApiProperty({ example: TaskStatus.Open, description: 'Current status of the task', enum: TaskStatus, default: TaskStatus.Open, required: false })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus = TaskStatus.Open;

  @ApiProperty({ example: '2024-12-31T23:59:59Z', description: 'Due date for the task (ISO 8601 format)', required: false })
  @IsOptional()
  // @IsISO8601({ message: 'Due date must be a valid ISO 8601 date string' }) // Use if needed
  dueDate?: Date;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the project this task belongs to' })
  @IsNotEmpty({ message: 'Project ID should not be empty' })
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @ApiProperty({ example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', description: 'ID of the user assigned to this task', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'Assignee ID must be a valid UUID' })
  assigneeId?: string;
}
```