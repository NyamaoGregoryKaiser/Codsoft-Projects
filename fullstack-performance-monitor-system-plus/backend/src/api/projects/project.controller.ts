import { Response, NextFunction } from 'express';
import * as projectService from './project.service';
import { AuthRequest } from '../../types/express';
import { CreateProjectSchema, UpdateProjectSchema } from './project.validation';

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = CreateProjectSchema.parse(req.body);
    const userId = req.user!.id; // `protect` middleware ensures req.user is available
    const project = await projectService.createProject(validatedData.name, userId);

    res.status(201).json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const projects = await projectService.getProjectsByOwner(userId);

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Project is already attached to req by `authorizeProjectAccess` middleware
    res.status(200).json({
      status: 'success',
      data: { project: req.project },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId;
    const validatedData = UpdateProjectSchema.parse(req.body);
    const updatedProject = await projectService.updateProject(projectId, validatedData.name);

    res.status(200).json({
      status: 'success',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId;
    await projectService.deleteProject(projectId);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};