```typescript
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ProjectService } from '../services/ProjectService';
import { createProjectSchema, updateProjectSchema } from '../utils/validationSchemas';
import { ForbiddenError } from '../middlewares/errorHandler';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const projectData = createProjectSchema.parse(req.body);
      if (!req.user?.id) {
        throw new ForbiddenError('User not authenticated for project creation.');
      }
      const project = await this.projectService.createProject(projectData, req.user.id);
      res.status(StatusCodes.CREATED).json(project);
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new ForbiddenError('User not authenticated for fetching projects.');
      }
      const projects = await this.projectService.getProjectsByOwner(req.user.id);
      res.status(StatusCodes.OK).json(projects);
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      // The `authorizeOwner` middleware already fetches and validates ownership,
      // and attaches the resource to `req.resource`.
      const project = (req as any).resource;
      res.status(StatusCodes.OK).json(project);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const projectData = updateProjectSchema.parse(req.body);
      if (!req.user?.id) {
        throw new ForbiddenError('User not authenticated for project update.');
      }
      const updatedProject = await this.projectService.updateProject(id, req.user.id, projectData);
      res.status(StatusCodes.OK).json(updatedProject);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!req.user?.id) {
        throw new ForbiddenError('User not authenticated for project deletion.');
      }
      await this.projectService.deleteProject(id, req.user.id);
      res.status(StatusCodes.OK).json({ message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
```