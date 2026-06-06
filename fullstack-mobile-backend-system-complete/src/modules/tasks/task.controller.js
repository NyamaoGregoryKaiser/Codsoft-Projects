```javascript
const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const taskService = require('./task.service');
const projectService = require('../projects/project.service');
const ApiError = require('../../utils/ApiError');

/**
 * Create a new task for a specific project.
 * @param {Object} req - Express request object
 *   @property {string} req.params.projectId - ID of the project to associate the task with
 *   @property {Object} req.body - Task data (title, description, assignedToId, status, priority, dueDate)
 *   @property {Object} req.user - Authenticated user (from auth middleware)
 * @param {Object} res - Express response object
 */
const createTask = catchAsync(async (req, res) => {
  const { projectId } = req.params;

  const project = await projectService.getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // Only owner or admin can create tasks in a project
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden to create tasks in this project');
  }

  const task = await taskService.createTask({ ...req.body, projectId });
  res.status(httpStatus.CREATED).send(task);
});

/**
 * Get all tasks for a specific project.
 * Supports filtering and pagination.
 * @param {Object} req - Express request object
 *   @property {string} req.params.projectId - ID of the project
 *   @property {Object} req.query - Query parameters for filtering (title, assignedToId, status, priority) and pagination (page, limit)
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const getTasks = catchAsync(async (req, res) => {
  const { projectId } = req.params;

  const project = await projectService.getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // Only project owner or admin can view tasks
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden to view tasks in this project');
  }

  const filter = { projectId };
  if (req.query.title) filter.title = { contains: req.query.title, mode: 'insensitive' };
  if (req.query.assignedToId) filter.assignedToId = req.query.assignedToId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    sortBy: req.query.sortBy,
  };

  const result = await taskService.queryTasks(filter, options);
  res.status(httpStatus.OK).send(result);
});

/**
 * Get a single task by ID within a project.
 * @param {Object} req - Express request object
 *   @property {string} req.params.projectId - ID of the project
 *   @property {string} req.params.taskId - ID of the task to retrieve
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const getTask = catchAsync(async (req, res) => {
  const { projectId, taskId } = req.params;

  const project = await projectService.getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // Only project owner or admin can view tasks
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden to view tasks in this project');
  }

  const task = await taskService.getTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found in this project');
  }

  res.status(httpStatus.OK).send(task);
});

/**
 * Update a task by ID within a project.
 * @param {Object} req - Express request object
 *   @property {string} req.params.projectId - ID of the project
 *   @property {string} req.params.taskId - ID of the task to update
 *   @property {Object} req.body - Updated task data
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const updateTask = catchAsync(async (req, res) => {
  const { projectId, taskId } = req.params;

  const project = await projectService.getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // Only project owner or admin can update tasks
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden to update tasks in this project');
  }

  const task = await taskService.getTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found in this project');
  }

  const updatedTask = await taskService.updateTaskById(taskId, req.body);
  res.status(httpStatus.OK).send(updatedTask);
});

/**
 * Delete a task by ID within a project.
 * @param {Object} req - Express request object
 *   @property {string} req.params.projectId - ID of the project
 *   @property {string} req.params.taskId - ID of the task to delete
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const deleteTask = catchAsync(async (req, res) => {
  const { projectId, taskId } = req.params;

  const project = await projectService.getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // Only project owner or admin can delete tasks
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden to delete tasks in this project');
  }

  const task = await taskService.getTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found in this project');
  }

  await taskService.deleteTaskById(taskId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
};
```