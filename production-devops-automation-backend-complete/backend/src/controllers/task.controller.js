```javascript
const taskService = require('../services/task.service');
const { createTaskSchema, updateTaskSchema } = require('../validators/task.validator');
const catchAsync = require('../utils/catchAsync');
const { invalidateCache } = require('../utils/cache.util'); // Assume task updates also affect project lists

const createTask = catchAsync(async (req, res, next) => {
  const { error } = createTaskSchema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { projectId } = req.params;
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  const task = await taskService.createTask(
    projectId, title, description, status, priority, dueDate, assigneeId, req.user.id, req.user.role
  );
  invalidateCache(`all_projects_user_${req.user.id}_role_${req.user.role}`); // Invalidate project cache
  res.status(201).json({ message: 'Task created successfully', task });
});

const getTaskById = catchAsync(async (req, res, next) => {
  const task = await taskService.getTaskById(req.params.taskId, req.user.id, req.user.role);
  res.status(200).json(task);
});

const updateTask = catchAsync(async (req, res, next) => {
  const { error } = updateTaskSchema.validate(req.body);
  if (error) {
    return next(error);
  }

  const task = await taskService.updateTask(req.params.taskId, req.body, req.user.id, req.user.role);
  invalidateCache(`all_projects_user_${req.user.id}_role_${req.user.role}`); // Invalidate project cache
  res.status(200).json({ message: 'Task updated successfully', task });
});

const deleteTask = catchAsync(async (req, res, next) => {
  const result = await taskService.deleteTask(req.params.taskId, req.user.id, req.user.role);
  invalidateCache(`all_projects_user_${req.user.id}_role_${req.user.role}`); // Invalidate project cache
  res.status(200).json(result);
});

module.exports = {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
};
```