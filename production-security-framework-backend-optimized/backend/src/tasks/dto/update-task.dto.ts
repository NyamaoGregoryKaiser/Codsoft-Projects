```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ example: TaskStatus.InProgress, description: 'Updated status of the task', enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'New project ID for the task', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId?: string; // Allow changing project

  @ApiProperty({ example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', description: 'New assignee ID for the task, or null to unassign', required: false, nullable: true })
  @IsOptional()
  @IsUUID('4', { message: 'Assignee ID must be a valid UUID' })
  assigneeId?: string | null; // Allow changing or unassigning
}
```