```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  token?: string; // Token is only present on login response
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  username: string;
  email: string;
  token: string;
  roles: string[];
}

export enum TaskStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner?: User; // Simplified user object in Project DTO
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  project?: Project; // Simplified project object in Task DTO
  assignee?: User; // Simplified user object in Task DTO
  createdAt?: string;
  updatedAt?: string;
}
```