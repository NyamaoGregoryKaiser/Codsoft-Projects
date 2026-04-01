import { IsString, MinLength, MaxLength, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TaskStatus, TaskPriority } from '../models/Task.entity';

export class CreateTaskDto {
  @IsString()
  @MinLength(3, { message: 'Task title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Task title cannot exceed 255 characters' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date string (YYYY-MM-DD)' })
  dueDate?: Date;

  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId!: string;

  @IsOptional()
  @IsUUID('4', { message: 'Assignee ID must be a valid UUID' })
  assigneeId?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Task title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Task title cannot exceed 255 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date string (YYYY-MM-DD)' })
  dueDate?: Date;

  @IsOptional()
  @IsUUID('4', { message: 'Assignee ID must be a valid UUID' })
  assigneeId?: string;
}