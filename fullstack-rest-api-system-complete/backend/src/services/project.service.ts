import { AppDataSource } from '../config/database';
import { Project } from '../models/Project.entity';
import { User, UserRole } from '../models/User.entity';
import { CreateProjectDto, UpdateProjectDto } from '../validators/project.validator';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';
import { clearCache } from '../middleware/cache.middleware';

export class ProjectService {
  private projectRepository = AppDataSource.getRepository(Project);
  private userRepository = AppDataSource.getRepository(User);

  public async createProject(projectData: CreateProjectDto, ownerId: string) {
    try {
      const owner = await this.userRepository.findOneBy({ id: ownerId });
      if (!owner) {
        throw new HttpException(404, `Owner with ID ${ownerId} not found.`);
      }

      const project = this.projectRepository.create({
        ...projectData,
        owner,
      });

      await this.projectRepository.save(project);
      await clearCache('/api/projects'); // Clear project list cache

      logger.info(`Project created: ${project.id} by user ${ownerId}`);
      return project;
    } catch (error) {
      logger.error(`ProjectService - createProject failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to create project.');
    }
  }

  public async findAllProjects() {
    try {
      const projects = await this.projectRepository.find({
        relations: ['owner'],
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      });
      return projects;
    } catch (error) {
      logger.error(`ProjectService - findAllProjects failed: ${error.message}`, error.stack);
      throw new HttpException(500, 'Failed to retrieve projects.');
    }
  }

  public async findProjectById(id: string) {
    try {
      const project = await this.projectRepository.findOne({
        where: { id },
        relations: ['owner', 'tasks', 'tasks.assignee'],
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
          tasks: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      if (!project) {
        throw new HttpException(404, `Project with ID ${id} not found.`);
      }
      return project;
    } catch (error) {
      logger.error(`ProjectService - findProjectById failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to retrieve project.');
    }
  }

  public async updateProject(projectId: string, updateData: UpdateProjectDto, userId: string, userRole: UserRole) {
    try {
      const project = await this.projectRepository.findOne({ where: { id: projectId }, relations: ['owner'] });
      if (!project) {
        throw new HttpException(404, `Project with ID ${projectId} not found.`);
      }

      // Authorization: Only owner or admin can update
      if (project.owner.id !== userId && userRole !== UserRole.ADMIN) {
        throw new HttpException(403, 'Forbidden: You do not have permission to update this project.');
      }

      if (updateData.ownerId && updateData.ownerId !== project.ownerId) {
        if (userRole !== UserRole.ADMIN) {
          throw new HttpException(403, 'Forbidden: Only administrators can change project ownership.');
        }
        const newOwner = await this.userRepository.findOneBy({ id: updateData.ownerId });
        if (!newOwner) {
          throw new HttpException(404, `New owner with ID ${updateData.ownerId} not found.`);
        }
        project.owner = newOwner;
        project.ownerId = newOwner.id;
      }

      Object.assign(project, updateData);
      await this.projectRepository.save(project);
      await clearCache(`/api/projects/${projectId}`); // Clear specific project cache
      await clearCache('/api/projects'); // Clear project list cache

      logger.info(`Project updated: ${project.id} by user ${userId}`);
      return project;
    } catch (error) {
      logger.error(`ProjectService - updateProject failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to update project.');
    }
  }

  public async deleteProject(projectId: string, userId: string, userRole: UserRole) {
    try {
      const project = await this.projectRepository.findOne({ where: { id: projectId }, relations: ['owner'] });
      if (!project) {
        throw new HttpException(404, `Project with ID ${projectId} not found.`);
      }

      // Authorization: Only owner or admin can delete
      if (project.owner.id !== userId && userRole !== UserRole.ADMIN) {
        throw new HttpException(403, 'Forbidden: You do not have permission to delete this project.');
      }

      await this.projectRepository.delete(projectId);
      await clearCache(`/api/projects/${projectId}`); // Clear specific project cache
      await clearCache('/api/projects'); // Clear project list cache

      logger.info(`Project deleted: ${projectId} by user ${userId}`);
    } catch (error) {
      logger.error(`ProjectService - deleteProject failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to delete project.');
    }
  }
}