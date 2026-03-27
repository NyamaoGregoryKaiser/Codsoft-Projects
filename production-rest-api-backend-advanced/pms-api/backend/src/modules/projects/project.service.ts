import { ProjectRepository } from './project.repository';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from './project.dtos';
import { ApiError } from '../../utils/apiError';
import logger from '../../config/logger';
import { clearCache } from '../../middleware/cache';

const PROJECTS_CACHE_KEY = '/api/v1/projects';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor(projectRepository: ProjectRepository = new ProjectRepository()) {
    this.projectRepository = projectRepository;
  }

  async getAllProjects(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository.findAllProjects(['createdBy']);
    return projects.map(project => this.toProjectResponseDto(project));
  }

  async getProjectById(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findProjectById(id, ['createdBy', 'tasks']);
    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }
    return this.toProjectResponseDto(project);
  }

  async createProject(createDto: CreateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const existingProject = await this.projectRepository.findOneBy({ name: createDto.name });
    if (existingProject) {
      throw new ApiError(409, 'Project with this name already exists.');
    }

    const newProject = this.projectRepository.create({
      ...createDto,
      createdById: userId,
    });

    const savedProject = await this.projectRepository.save(newProject);
    clearCache(PROJECTS_CACHE_KEY); // Invalidate cache after creation
    logger.info(`Project created: ${savedProject.name} by user ${userId}`);
    return this.toProjectResponseDto(savedProject);
  }

  async updateProject(id: string, updateDto: UpdateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findProjectById(id);
    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }

    // Ensure only the creator or admin can update
    if (project.createdById !== userId && (await this.getUserRole(userId)) !== 'admin') {
      throw new ApiError(403, 'Forbidden: You can only update projects you created.');
    }

    if (updateDto.name && updateDto.name !== project.name) {
      const existingProject = await this.projectRepository.findOneBy({ name: updateDto.name });
      if (existingProject && existingProject.id !== id) {
        throw new ApiError(409, 'Project with this name already exists.');
      }
    }

    Object.assign(project, updateDto);
    const updatedProject = await this.projectRepository.save(project);
    clearCache(PROJECTS_CACHE_KEY); // Invalidate cache after update
    clearCache(`/api/v1/projects/${id}`); // Invalidate specific project cache
    logger.info(`Project updated: ${updatedProject.name} by user ${userId}`);
    return this.toProjectResponseDto(updatedProject);
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findProjectById(id);
    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }

    // Ensure only the creator or admin can delete
    if (project.createdById !== userId && (await this.getUserRole(userId)) !== 'admin') {
      throw new ApiError(403, 'Forbidden: You can only delete projects you created.');
    }

    const deleteResult = await this.projectRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new ApiError(404, 'Project not found (unexpected).');
    }
    clearCache(PROJECTS_CACHE_KEY); // Invalidate cache after deletion
    clearCache(`/api/v1/projects/${id}`); // Invalidate specific project cache
    logger.info(`Project deleted: ${id} by user ${userId}`);
  }

  // Helper to get user role (could be moved to a shared utility or user service)
  private async getUserRole(userId: string): Promise<string | undefined> {
    const user = await this.projectRepository.manager.findOneBy('User', { id: userId });
    return user?.role;
  }

  private toProjectResponseDto(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdById: project.createdById,
      createdByUsername: project.createdBy ? project.createdBy.username : 'Unknown',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}