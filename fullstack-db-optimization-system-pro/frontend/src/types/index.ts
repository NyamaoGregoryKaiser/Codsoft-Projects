import { DatabaseType, SuggestionType, TaskStatus, UserRole } from './auth'; // Import enums

export type User = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  isAdmin: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  id: number;
  name: string;
  dbType: DatabaseType;
  host: string;
  port: number;
  dbName: string;
  username: string;
  password?: string; // Optional for display, sensitive data not always returned
  description?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
};

export type DatabaseCreate = Omit<Database, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> & { ownerId?: number };
export type DatabaseUpdate = Partial<DatabaseCreate>;

export type Metric = {
  id: number;
  databaseId: number;
  timestamp: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  diskIoOpsSec: number;
  activeConnections: number;
  totalQueriesSec: number;
  avgQueryLatencyMs: number;
  slowQueriesJson?: Record<string, any>;
  customMetricsJson?: Record<string, any>;
};

export type MetricCreate = Omit<Metric, 'id'>;
export type MetricUpdate = Partial<MetricCreate>;

export type OptimizationSuggestion = {
  id: number;
  databaseId: number;
  suggestedById: number;
  suggestionType: SuggestionType;
  description: string;
  sqlCommand?: string;
  impactEstimate?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OptimizationSuggestionCreate = Omit<OptimizationSuggestion, 'id' | 'suggestedById' | 'createdAt' | 'updatedAt'>;
export type OptimizationSuggestionUpdate = Partial<OptimizationSuggestionCreate>;

export type Task = {
  id: number;
  databaseId: number;
  suggestionId?: number;
  assignedToId?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskCreate = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type TaskUpdate = Partial<TaskCreate>;

export type Token = {
  accessToken: string;
  tokenType: string;
};

// Utility types for forms
export type UserForm = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isAdmin' | 'isActive'> & { password?: string, currentPassword?: string };
export type LoginForm = { username: string; password: string };
export type RegisterForm = Omit<UserForm, 'isActive' | 'isAdmin' | 'role'> & { password: string };
export type ForgotPasswordForm = { email: string };
export type ResetPasswordForm = { token: string; newPassword: string };

// API Response structure for pagination
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  skip: number;
  limit: number;
};

export type MetricChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
  }[];
};