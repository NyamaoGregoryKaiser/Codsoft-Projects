// DTO for creating a new project
export interface CreateProjectDto {
  name: string;
  description?: string;
}

// DTO for updating an existing project
export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

// DTO for project response (including createdBy user info)
export interface ProjectResponseDto {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdByUsername: string;
  createdAt: Date;
  updatedAt: Date;
}