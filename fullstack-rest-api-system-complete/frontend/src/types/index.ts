export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  owner: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  tasks?: Task[]; // Populated on project detail
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: string;
  assignee?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  comments?: Comment[]; // Populated on task detail
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}