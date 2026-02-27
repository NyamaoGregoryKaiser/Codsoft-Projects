```typescript
import { Injectable, NotFoundException, ConflictException, CACHE_MANAGER, Inject } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { LoggerService } from '../common/logger/logger.service';
import { Cache } from 'cache-manager';

@Injectable()
export class ProjectsService {
  private readonly PROJECT_CACHE_KEY_PREFIX = 'project:';

  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private logger: LoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      owner: { id: userId }, // Assign the authenticated user as the owner
    });
    await this.projectsRepository.save(project);
    this.logger.log(`Project created: ${project.id} by user ${userId}`, ProjectsService.name);
    // Invalidate cache for projects list
    await this.cacheManager.del(this.PROJECT_CACHE_KEY_PREFIX + 'all');
    await this.cacheManager.del(this.PROJECT_CACHE_KEY_PREFIX + `user:${userId}`); // Invalidate user-specific project cache
    return project;
  }

  async findAll(userId?: string): Promise<Project[]> {
    const cacheKey = userId ? this.PROJECT_CACHE_KEY_PREFIX + `user:${userId}` : this.PROJECT_CACHE_KEY_PREFIX + 'all';
    const cachedProjects = await this.cacheManager.get<Project[]>(cacheKey);
    if (cachedProjects) {
      this.logger.debug(`Returning projects for user ${userId || 'all'} from cache`, ProjectsService.name);
      return cachedProjects;
    }

    const query = this.projectsRepository.createQueryBuilder('project').leftJoinAndSelect('project.owner', 'owner');
    if (userId) {
      query.where('project.ownerId = :userId', { userId });
    }
    const projects = await query.getMany();
    await this.cacheManager.set(cacheKey, projects, { ttl: 60 }); // Cache for 60 seconds
    this.logger.log(`Returning projects for user ${userId || 'all'} from database`, ProjectsService.name);
    return projects;
  }

  async findOne(id: string): Promise<Project> {
    const cachedProject = await this.cacheManager.get<Project>(this.PROJECT_CACHE_KEY_PREFIX + id);
    if (cachedProject) {
      this.logger.debug(`Returning project ${id} from cache`, ProjectsService.name);
      return cachedProject;
    }

    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['owner'], // Load the owner details
    });
    if (!project) {
      this.logger.warn(`Project not found: ${id}`, ProjectsService.name);
      throw new NotFoundException(`Project with ID "${id}" not found.`);
    }
    await this.cacheManager.set(this.PROJECT_CACHE_KEY_PREFIX + id, project, { ttl: 300 }); // Cache for 5 minutes
    this.logger.log(`Returning project ${id} from database`, ProjectsService.name);
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id); // Throws NotFoundException if not found

    // Check if new title conflicts with another project for the same owner
    if (updateProjectDto.title && updateProjectDto.title !== project.title) {
      const existingProjectWithTitle = await this.projectsRepository.findOneBy({
        title: updateProjectDto.title,
        owner: { id: project.owner.id },
      });
      if (existingProjectWithTitle && existingProjectWithTitle.id !== id) {
        this.logger.warn(`Project update failed for ${id}: Title "${updateProjectDto.title}" already in use by owner ${project.owner.id}.`, ProjectsService.name);
        throw new ConflictException(`Project with title "${updateProjectDto.title}" already exists for this user.`);
      }
    }

    // Update fields
    Object.assign(project, updateProjectDto);
    await this.projectsRepository.save(project);
    this.logger.log(`Project updated: ${id}`, ProjectsService.name);
    // Invalidate cache for the specific project, its owner's projects, and all projects list
    await this.cacheManager.del(this.PROJECT_CACHE_KEY_PREFIX + id);
    await this.cacheManager.del(this.PROJECT_CACHE_KEY_PREFIX + 'all');
    await this.cacheManager.del(this.PROJECT_CACHE_KEY_PREFIX + `user:${project.owner.id}`);
    return project;
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['owner'], // Load owner to invalidate cache
    });
    if (!project) {
      this.logger.warn(`Project deletion failed: ID ${id} not found.`, ProjectsService.name);
      throw new NotFoundException(`Project with ID "${id}" not found.`);
    }

    const result = await this.projectsRepository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`Project deletion failed after initial find: ID ${id} not deleted.`, ProjectsService.name);
      throw new NotFoundException(`Project with ID "${id}" not found.`);
    }
    this.logger.log(`Project deleted: ${id}`, ProjectsService.name);
    // Invalidate cache for the specific project, its owner's projects, and all projects list
    await this.cacheManager.del(this.PROJECT_CACHE_KEY_PREFIX + id);
    await this.cacheManager.del(this.PROJECT_CACHE_KEY_PREFIX + 'all');
    await this.cacheManager.del(this.PROJECT_CACHE_KEY_PREFIX + `user:${project.owner.id}`);
  }
}
```