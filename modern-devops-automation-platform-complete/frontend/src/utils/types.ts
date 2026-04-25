```typescript
import { TaskStatus } from '../../../backend/src/entities/Task'; // Import TaskStatus from backend, assuming shared type or careful replication

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  projects: Project[];
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner: Omit<User, 'projects' | 'tasks' | 'createdAt' | 'updatedAt'>; // Simplified owner
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null; // ISO 8601 string
  project: Project;
  assignedTo: Omit<User, 'projects' | 'tasks' | 'createdAt' | 'updatedAt'> | null;
  createdAt: string;
  updatedAt: string;
}

// DTOs for API requests
export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CreateProjectData {
  name: string;
  description?: string | null;
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: string | null; // ISO 8601 string
  assignedToId?: string | null; // UUID of the user
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: string | null; // ISO 8601 string
  assignedToId?: string | null; // UUID of the user
}
```