```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { taskService } = require('../services');
const ApiError = require('../utils/ApiError');

const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(task);
});

const getTasks = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.title) filter.title = { contains: req.query.title, mode: 'insensitive' };
  if (req.query.projectId) filter.projectId = req.query.projectId;
  if (req.query.assigneeId) filter.assigneeId = req.query.assigneeId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  if (req.query.search) {
    filter.OR = [
      { title: { contains: req.query.search, mode: 'insensitive' } },
      { description: { contains: req.query.search, mode: 'insensitive' } },
    ];
    delete req.query.search;
  }

  const options = {
    limit: req.query.limit,
    page: req.query.page,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };
  const result = await taskService.queryTasks(filter, options, req.user.id);
  res.send(result);
});

const getTask = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId);
  // Ensure user is a member of the task's project
  const project = await prisma.project.findUnique({
    where: { id: task.projectId },
    include: { members: true },
  });
  const isMember = project.members.some(member => member.id === req.user.id);
  if (!task || (!isMember && req.user.role !== 'ADMIN')) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found or you are not authorized to view it');
  }
  res.send(task);
});

const updateTask = catchAsync(async (req, res) => {
  // isOwnerOrAdmin middleware (or similar check) ensures user is authorized
  const task = await taskService.updateTaskById(req.params.taskId, req.body, req.user.id);
  res.send(task);
});

const deleteTask = catchAsync(async (req, res) => {
  // isOwnerOrAdmin middleware (or similar check) ensures user is authorized
  await taskService.deleteTaskById(req.params.taskId, req.user.id);
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