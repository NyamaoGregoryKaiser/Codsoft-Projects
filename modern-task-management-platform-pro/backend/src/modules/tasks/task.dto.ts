```typescript
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID, IsEnum, IsDateString, IsBoolean, IsDate } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../database/entities/task.entity';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'Task title is required' })
  @IsString({ message: 'Task title must be a string' })
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString({ message: 'Task description must be a string' })
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date string' })
  dueDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid assignee ID format' })
  assigneeId?: string; // UUID of the user assigned to this task
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString({ message: 'Task title must be a string' })
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString({ message: 'Task description must be a string' })
  description?: string | null; // Allow setting description to null

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date string' })
  dueDate?: string | null; // Allow setting due date to null

  @IsOptional()
  @IsUUID('4', { message: 'Invalid assignee ID format' })
  assigneeId?: string | null; // Allow assigning to null
}

// DTO for project ID parameter validation
export class ProjectIdParamDto {
  @IsUUID('4', { message: 'Invalid project ID format' })
  projectId!: string;
}

// DTO for task ID parameter validation
export class TaskIdParamDto {
  @IsUUID('4', { message: 'Invalid task ID format' })
  taskId!: string;
}

// DTO for task list query parameters
export class TaskListQueryDto {
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

// DTO for Task Response (simplified)
export class TaskResponseDto {
  id!: string;
  title!: string;
  description?: string;
  status!: TaskStatus;
  priority!: TaskPriority;
  dueDate?: Date;
  project!: { id: string; name: string };
  assignee?: { id: string; firstName: string; lastName: string; email: string };
  createdAt!: Date;
  updatedAt!: Date;
}
```