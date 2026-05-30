```javascript
const projectService = require('../services/project.service');
const { createProjectSchema, updateProjectSchema } = require('../validators/project.validator');
const catchAsync = require('../utils/catchAsync');
const { cache, invalidateCache } = require('../utils/cache.util');
const logger = require('../config/logger.config');

const createProject = catchAsync(async (req, res, next) => {
  const { error } = createProjectSchema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { name, description } = req.body;
  const project = await projectService.createProject(name, description, req.user.id);
  invalidateCache('all_projects'); // Invalidate cache after creation
  res.status(201).json({ message: 'Project created successfully', project });
});

const getAllProjects = catchAsync(async (req, res, next) => {
  const cacheKey = `all_projects_user_${req.user.id}_role_${req.user.role}`;
  const cachedProjects = await cache.get(cacheKey);

  if (cachedProjects) {
    logger.debug(`Cache hit for ${cacheKey}`);
    return res.status(200).json(JSON.parse(cachedProjects));
  }

  logger.debug(`Cache miss for ${cacheKey}. Fetching from DB.`);
  const projects = await projectService.getAllProjects(req.user.id, req.user.role);
  await cache.set(cacheKey, JSON.stringify(projects), 'EX', 60); // Cache for 60 seconds
  res.status(200).json(projects);
});

const getProjectById = catchAsync(async (req, res, next) => {
  const project = await projectService.getProjectById(req.params.id, req.user.id, req.user.role);
  res.status(200).json(project);
});

const updateProject = catchAsync(async (req, res, next) => {
  const { error } = updateProjectSchema.validate(req.body);
  if (error) {
    return next(error);
  }

  const project = await projectService.updateProject(req.params.id, req.body, req.user.id, req.user.role);
  invalidateCache('all_projects'); // Invalidate cache after update
  res.status(200).json({ message: 'Project updated successfully', project });
});

const deleteProject = catchAsync(async (req, res, next) => {
  const result = await projectService.deleteProject(req.params.id, req.user.id, req.user.role);
  invalidateCache('all_projects'); // Invalidate cache after deletion
  res.status(200).json(result);
});

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
```