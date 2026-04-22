import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional, IsArray, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../../shared/enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ description: 'Title of the task', minLength: 1, maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Description of the task', required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Status of the task', enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ description: 'Due date for the task (ISO 8601 format)', required: false, example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({ description: 'ID of the project this task belongs to' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'ID of the user assigned to this task', required: false })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ description: 'Array of tag IDs to associate with this task', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

export class UpdateTaskDto {
  @ApiProperty({ description: 'Updated title of the task', required: false, minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ description: 'Updated description of the task', required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Updated status of the task', enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ description: 'Updated due date for the task (ISO 8601 format)', required: false, example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({ description: 'New project ID if task is moved to another project', required: false })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: 'New assignee ID for the task, or null to unassign', required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @ApiProperty({ description: 'New array of tag IDs to associate with this task', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

export class AssignTaskDto {
  @ApiProperty({ description: 'ID of the user to assign the task to' })
  @IsUUID()
  @IsNotEmpty()
  assigneeId: string;
}