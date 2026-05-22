```typescript
import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { AppError } from '../../utils/appError';
import * as yup from 'yup';

const projectService = new ProjectService();

const projectSchema = yup.object().shape({
  name: yup.string().min(3).max(255).required(),
  description: yup.string().max(1000).optional(),
});

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectData = await projectSchema.validate(req.body, { abortEarly: false });
    const project = await projectService.createProject(projectData, req.user!);
    res.status(201).json({
      status: 'success',
      data: { project },
    });
  } catch (error: any) {
    if (error instanceof yup.ValidationError) {
      return next(new AppError(error.errors.join(', '), 400));
    }
    next(error);
  }
};

export const getProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (project.owner.id !== req.user?.id && req.user?.role !== 'admin') {
      return next(new AppError('You do not have access to this project', 403));
    }
    res.status(200).json({
      status: 'success',
      data: { project },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Admins can see all projects, users see only their own
    const ownerId = req.user?.role === 'admin' ? undefined : req.user?.id;
    const projects = await projectService.getAllProjects(ownerId);
    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects },
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectData = await projectSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    const project = await projectService.updateProject(req.params.id, projectData, req.user!.id);
    res.status(200).json({
      status: 'success',
      data: { project },
    });
  } catch (error: any) {
    if (error instanceof yup.ValidationError) {
      return next(new AppError(error.errors.join(', '), 400));
    }
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectService.deleteProject(req.params.id, req.user!.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};
```