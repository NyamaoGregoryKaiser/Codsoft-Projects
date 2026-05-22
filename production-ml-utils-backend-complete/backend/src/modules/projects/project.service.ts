```typescript
import { ProjectRepository } from './project.repository';
import { Project } from './project.entity';
import { AppError } from '../../utils/appError';
import { User } from '../users/user.entity';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

  async createProject(projectData: Partial<Project>, owner: User): Promise<Project> {
    const project = this.projectRepository.create({ ...projectData, owner });
    return this.projectRepository.create(project);
  }

  async getProjectById(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    return project;
  }

  async getAllProjects(ownerId?: string): Promise<Project[]> {
    return this.projectRepository.findAll(ownerId);
  }

  async updateProject(id: string, projectData: Partial<Project>, userId: string): Promise<Project> {
    const project = await this.getProjectById(id);
    if (project.owner.id !== userId) {
      throw new AppError('You do not have permission to update this project', 403);
    }
    const updatedProject = await this.projectRepository.update(id, projectData);
    if (!updatedProject) {
        throw new AppError('Failed to update project', 500);
    }
    return updatedProject;
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.getProjectById(id);
    if (project.owner.id !== userId) {
      throw new AppError('You do not have permission to delete this project', 403);
    }
    await this.projectRepository.delete(id);
  }
}
```