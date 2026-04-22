export interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export enum Role {
  User = 'user',
  Admin = 'admin',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  isCompleted: boolean;
  ownerId: string;
  owner?: User;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  projectId: string;
  project?: Project;
  assigneeId?: string;
  assignee?: User;
  tags?: Tag[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: User;
  taskId: string;
  task?: Task;
  createdAt: string;
  updatedAt: string;
}

// DTOs for frontend requests
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  username: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  isCompleted?: boolean;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  projectId: string;
  assigneeId?: string | null;
  tagIds?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  projectId?: string;
  assigneeId?: string | null;
  tagIds?: string[];
}

export interface CreateCommentData {
  content: string;
  taskId: string;
}

export interface UpdateCommentData {
  content?: string;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}