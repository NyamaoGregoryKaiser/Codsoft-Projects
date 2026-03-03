import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../../database/entities/Task';
import { PaginationDto } from '../../../shared/dtos/Pagination.dto';

export class TaskQueryParamsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid status provided' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid priority provided' })
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid assigneeId format' })
  assigneeId?: string;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string; // Search by title or description
}