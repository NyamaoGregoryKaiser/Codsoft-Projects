```javascript
const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const projectService = require('./project.service');
const ApiError = require('../../utils/ApiError');

/**
 * Create a new project.
 * @param {Object} req - Express request object
 *   @property {Object} req.body - Project data (name, description)
 *   @property {Object} req.user - Authenticated user (from auth middleware)
 * @param {Object} res - Express response object
 */
const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(project);
});

/**
 * Get all projects.
 * Supports filtering and pagination.
 * @param {Object} req - Express request object
 *   @property {Object} req.query - Query parameters for filtering (name, ownerId, status) and pagination (page, limit)
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const getProjects = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.name) filter.name = { contains: req.query.name, mode: 'insensitive' };
  if (req.query.ownerId) filter.ownerId = req.query.ownerId;
  if (req.query.status) filter.status = req.query.status;

  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
  };

  const result = await projectService.queryProjects(filter, options, req.user);
  res.status(httpStatus.OK).send(result);
});

/**
 * Get a single project by ID.
 * @param {Object} req - Express request object
 *   @property {string} req.params.projectId - ID of the project
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  // Ensure user has access (owner or admin)
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden');
  }
  res.status(httpStatus.OK).send(project);
});

/**
 * Update a project by ID.
 * @param {Object} req - Express request object
 *   @property {string} req.params.projectId - ID of the project to update
 *   @property {Object} req.body - Updated project data
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  // Only owner or admin can update
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden');
  }

  const updatedProject = await projectService.updateProjectById(req.params.projectId, req.body);
  res.status(httpStatus.OK).send(updatedProject);
});

/**
 * Delete a project by ID.
 * @param {Object} req - Express request object
 *   @property {string} req.params.projectId - ID of the project to delete
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const deleteProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  // Only owner or admin can delete
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden');
  }

  await projectService.deleteProjectById(req.params.projectId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};
```