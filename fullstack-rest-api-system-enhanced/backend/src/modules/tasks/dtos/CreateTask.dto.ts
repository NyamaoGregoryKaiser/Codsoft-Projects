import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../../database/entities/Task';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format for dueDate' })
  dueDate?: Date;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid assignee ID format' })
  assigneeId?: string;
}