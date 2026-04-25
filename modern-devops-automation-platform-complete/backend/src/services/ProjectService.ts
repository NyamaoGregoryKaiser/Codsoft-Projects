```typescript
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Project } from '../entities/Project';
import { User } from '../entities/User';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler';
import { CreateProjectDto, UpdateProjectDto } from '../utils/validationSchemas';
import { getRedisClient } from '../utils/redisClient';
import { logger } from '../utils/logger';

export class ProjectService {
  private projectRepository: Repository<Project>;
  private userRepository: Repository<User>;
  private redisClient: ReturnType<typeof getRedisClient>;

  constructor() {
    this.projectRepository = AppDataSource.getRepository(Project);
    this.userRepository = AppDataSource.getRepository(User);
    this.redisClient = getRedisClient();
  }

  private async invalidateUserProjectsCache(userId: string) {
    const cacheKey = `projects:user:${userId}`;
    await this.redisClient.del(cacheKey);
    logger.debug(`Invalidated cache for key: ${cacheKey}`);
  }

  async createProject(projectData: CreateProjectDto, ownerId: string): Promise<Project> {
    const owner = await this.userRepository.findOneBy({ id: ownerId });
    if (!owner) {
      throw new BadRequestError('Project owner not found.');
    }

    const newProject = this.projectRepository.create({
      ...projectData,
      owner: owner,
    });

    const savedProject = await this.projectRepository.save(newProject);
    await this.invalidateUserProjectsCache(ownerId);
    return savedProject;
  }

  async getProjectsByOwner(ownerId: string): Promise<Project[]> {
    const projects = await this.projectRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'description', 'createdAt', 'updatedAt'], // Select specific fields
    });
    return projects;
  }

  async getProjectById(projectId: string, ownerId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, owner: { id: ownerId } },
      relations: ['owner', 'tasks'],
    });

    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found or you don't have access.`);
    }
    return project;
  }

  async updateProject(projectId: string, ownerId: string, projectData: UpdateProjectDto): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, owner: { id: ownerId } },
    });

    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found or you don't have access.`);
    }

    this.projectRepository.merge(project, projectData);
    const updatedProject = await this.projectRepository.save(project);
    await this.invalidateUserProjectsCache(ownerId);
    return updatedProject;
  }

  async deleteProject(projectId: string, ownerId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, owner: { id: ownerId } },
    });

    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found or you don't have access.`);
    }

    await this.projectRepository.remove(project);
    await this.invalidateUserProjectsCache(ownerId);
  }
}
```