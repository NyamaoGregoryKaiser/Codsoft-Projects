```typescript
import { Request, Response, NextFunction } from 'express';
import * as projectService from './project.service';
import ApiResponse from '../../utils/apiResponse';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { getPaginationOptions } from '../../utils/pagination';

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const createProjectDto: CreateProjectDto = req.body;
    const newProject = await projectService.createProject(createProjectDto, req.user.id);
    res.status(201).json(ApiResponse.success(newProject, 'Project created successfully', 201));
  } catch (error) {
    next(error);
  }
};

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const paginationOptions = getPaginationOptions(req);
    const { projects, total } = await projectService.findAllProjects(req.user.id, paginationOptions);

    res.status(200).json(ApiResponse.success(projects, 'Projects fetched successfully', 200, {
      total,
      limit: paginationOptions.limit,
      page: paginationOptions.page,
      totalPages: Math.ceil(total / paginationOptions.limit),
    }));
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const projectId = req.params.id;
    const project = await projectService.findProjectById(projectId, req.user.id);
    res.status(200).json(ApiResponse.success(project, 'Project fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const projectId = req.params.id;
    const updateProjectDto: UpdateProjectDto = req.body;
    const updatedProject = await projectService.updateProject(projectId, updateProjectDto, req.user.id);
    res.status(200).json(ApiResponse.success(updatedProject, 'Project updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const projectId = req.params.id;
    await projectService.deleteProject(projectId, req.user.id);
    res.status(204).json(ApiResponse.success(null, 'Project deleted successfully'));
  } catch (error) {
    next(error);
  }
};
```