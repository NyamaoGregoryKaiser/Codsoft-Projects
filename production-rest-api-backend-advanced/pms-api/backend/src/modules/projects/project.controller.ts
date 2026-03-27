import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './project.dtos';
import { ApiError } from '../../utils/apiError';

export class ProjectController {
  private projectService = new ProjectService();

  getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectService.getAllProjects();
      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  };

  getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await this.projectService.getProjectById(req.params.id);
      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  };

  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createDto: CreateProjectDto = req.body;
      if (!createDto.name) {
        throw new ApiError(400, 'Project name is required.');
      }
      if (!req.user?.id) {
        throw new ApiError(401, 'User not authenticated to create project.');
      }
      const newProject = await this.projectService.createProject(createDto, req.user.id);
      res.status(201).json(newProject);
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateDto: UpdateProjectDto = req.body;
      if (Object.keys(updateDto).length === 0) {
        throw new ApiError(400, 'At least one field (name, description) must be provided for update.');
      }
      if (!req.user?.id) {
        throw new ApiError(401, 'User not authenticated to update project.');
      }
      const updatedProject = await this.projectService.updateProject(req.params.id, updateDto, req.user.id);
      res.status(200).json(updatedProject);
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new ApiError(401, 'User not authenticated to delete project.');
      }
      await this.projectService.deleteProject(req.params.id, req.user.id);
      res.status(204).send(); // No content for successful deletion
    } catch (error) {
      next(error);
    }
  };
}