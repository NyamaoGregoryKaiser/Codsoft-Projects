```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { taskService, projectService } = require('../services');

const createTask = catchAsync(async (req, res) => {
  const { projectId } = req.body;
  const project = await projectService.getProjectById(projectId);

  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  // Ensure the user is either the owner or a member of the project
  const isMember = project.members.some(member => member.id === req.user.id);
  const isOwner = project.ownerId === req.user.id;

  if (!isMember && !isOwner && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only create tasks for projects you are a member of');
  }

  const task = await taskService.createTask(req.body);
  res.status(httpStatus.CREATED).send(task);
});

const getTasks = catchAsync(async (req, res) => {
  // Can add filters here, e.g., by projectId, assignedTo, status
  const tasks = await taskService.queryTasks(req.query);
  res.send(tasks);
});

const getTask = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Ensure the user is a member/owner of the task's project
  const project = await projectService.getProjectById(task.projectId);
  const isMember = project.members.some(member => member.id === req.user.id);
  const isOwner = project.ownerId === req.user.id;

  if (!isMember && !isOwner && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access to task forbidden');
  }

  res.send(task);
});

const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTaskById(req.params.taskId, req.body, req.user);
  res.send(task);
});

const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTaskById(req.params.taskId, req.user);
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