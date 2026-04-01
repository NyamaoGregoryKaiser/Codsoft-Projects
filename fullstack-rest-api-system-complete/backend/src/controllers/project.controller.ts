import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto, UpdateProjectDto } from '../validators/project.validator';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  public createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createData = plainToClass(CreateProjectDto, req.body);
      await validateOrReject(createData, { validationError: { target: false } });

      const ownerId = req.user!.id; // Owner is the authenticated user
      const project = await this.projectService.createProject(createData, ownerId);
      res.status(201).json(project);
    } catch (error) {
      logger.error(`ProjectController - createProject failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) {
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectService.findAllProjects();
      res.status(200).json(projects);
    } catch (error) {
      logger.error(`ProjectController - getAllProjects failed: ${error.message}`, error.stack);
      next(error);
    }
  };

  public getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.findProjectById(id);
      res.status(200).json(project);
    } catch (error) {
      logger.error(`ProjectController - getProjectById failed: ${error.message}`, error.stack);
      next(error);
    }
  };

  public updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = plainToClass(UpdateProjectDto, req.body);
      await validateOrReject(updateData, { validationError: { target: false } });

      const userId = req.user!.id;
      const userRole = req.user!.role;
      const updatedProject = await this.projectService.updateProject(id, updateData, userId, userRole);
      res.status(200).json(updatedProject);
    } catch (error) {
      logger.error(`ProjectController - updateProject failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) {
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      await this.projectService.deleteProject(id, userId, userRole);
      res.status(204).send();
    } catch (error) {
      logger.error(`ProjectController - deleteProject failed: ${error.message}`, error.stack);
      next(error);
    }
  };
}