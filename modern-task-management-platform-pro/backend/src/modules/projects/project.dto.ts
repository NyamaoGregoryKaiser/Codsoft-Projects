```typescript
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty({ message: 'Project name is required' })
  @IsString({ message: 'Project name must be a string' })
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString({ message: 'Project description must be a string' })
  description?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString({ message: 'Project name must be a string' })
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString({ message: 'Project description must be a string' })
  description?: string;
}

// DTO for project ID parameter validation
export class ProjectIdParamDto {
  @IsUUID('4', { message: 'Invalid project ID format' })
  id!: string;
}

// DTO for project list query parameters
export class ProjectListQueryDto {
  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC', 'asc', 'desc'])
  orderDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

// DTO for Project Response (simplified)
export class ProjectResponseDto {
  id!: string;
  name!: string;
  description?: string;
  owner!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}
```