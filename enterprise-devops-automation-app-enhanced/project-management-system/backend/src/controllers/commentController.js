```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { commentService, taskService, projectService } = require('../services');

const createComment = catchAsync(async (req, res) => {
  const { taskId } = req.body;
  const task = await taskService.getTaskById(taskId);

  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Ensure the user is a member/owner of the task's project
  const project = await projectService.getProjectById(task.projectId);
  const isMember = project.members.some(member => member.id === req.user.id);
  const isOwner = project.ownerId === req.user.id;

  if (!isMember && !isOwner && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only comment on tasks in projects you are a member of');
  }

  req.body.userId = req.user.id; // Set current user as comment author
  const comment = await commentService.createComment(req.body);
  res.status(httpStatus.CREATED).send(comment);
});

const getCommentsByTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  const task = await taskService.getTaskById(taskId);

  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Ensure the user is a member/owner of the task's project
  const project = await projectService.getProjectById(task.projectId);
  const isMember = project.members.some(member => member.id === req.user.id);
  const isOwner = project.ownerId === req.user.id;

  if (!isMember && !isOwner && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access to comments forbidden');
  }

  const comments = await commentService.getCommentsByTaskId(taskId);
  res.send(comments);
});

const updateComment = catchAsync(async (req, res) => {
  const comment = await commentService.updateCommentById(req.params.commentId, req.body, req.user);
  res.send(comment);
});

const deleteComment = catchAsync(async (req, res) => {
  await commentService.deleteCommentById(req.params.commentId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
};
```