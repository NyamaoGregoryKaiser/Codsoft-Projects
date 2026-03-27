import { TaskStatus, TaskPriority } from "./task.entity";

// DTO for creating a new task
export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId: string;
  assignedToId?: string;
}

// DTO for updating an existing task
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string | null; // Allow null to unassign
}

// DTO for task response
export interface TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  assignedToId?: string;
  assignedToUsername?: string;
  createdById: string;
  createdByUsername: string;
  createdAt: Date;
  updatedAt: Date;
}