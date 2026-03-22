```javascript
const httpStatus = require('http-status');
const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const { invalidateCache } = require('../middlewares/cache');

const createTask = async (taskData, creatorId) => {
  const project = await prisma.project.findUnique({
    where: { id: taskData.projectId },
    include: { members: true },
  });

  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // Ensure creator is a member of the project
  const isCreatorMember = project.members.some(member => member.id === creatorId);
  if (!isCreatorMember) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Creator must be a member of the project to create tasks.');
  }

  // If assignee is provided, ensure they are a member of the project
  if (taskData.assigneeId) {
    const isAssigneeMember = project.members.some(member => member.id === taskData.assigneeId);
    if (!isAssigneeMember) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Assignee must be a member of the project.');
    }
  }

  const task = await prisma.task.create({
    data: {
      ...taskData,
      creatorId: creatorId,
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
      creator: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  invalidateCache(`tasks:project:${taskData.projectId}`); // Invalidate specific project task list
  return task;
};

const queryTasks = async (filter, options, userId) => {
  const { limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  // Only retrieve tasks from projects the user is a member of
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              id: userId,
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  const userProjectIds = userProjects.map(p => p.id);

  const whereClause = {
    ...filter,
    projectId: {
      in: userProjectIds,
    },
  };

  const tasks = await prisma.task.findMany({
    where: whereClause,
    take: parseInt(limit),
    skip: parseInt(skip),
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
      creator: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  const totalResults = await prisma.task.count({ where: whereClause });
  const totalPages = Math.ceil(totalResults / limit);

  return { tasks, totalResults, totalPages, page: parseInt(page), limit: parseInt(limit) };
};

const getTaskById = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
      creator: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }
  return task;
};

const updateTaskById = async (taskId, updateBody, userId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  const project = await prisma.project.findUnique({
    where: { id: task.projectId },
    include: { members: true },
  });

  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Associated project not found');
  }

  // Only project owner or task creator can update a task
  if (project.ownerId !== userId && task.creatorId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to update this task');
  }

  // If assignee is being updated, ensure new assignee is a member of the project
  if (updateBody.assigneeId) {
    const isAssigneeMember = project.members.some(member => member.id === updateBody.assigneeId);
    if (!isAssigneeMember) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New assignee must be a member of the project.');
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateBody,
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
      creator: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  invalidateCache(`tasks:project:${task.projectId}`); // Invalidate specific project task list
  return updatedTask;
};

const deleteTaskById = async (taskId, userId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  const project = await prisma.project.findUnique({ where: { id: task.projectId } });
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Associated project not found');
  }

  // Only project owner or task creator can delete a task
  if (project.ownerId !== userId && task.creatorId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to delete this task');
  }

  await prisma.task.delete({ where: { id: taskId } });
  invalidateCache(`tasks:project:${task.projectId}`); // Invalidate specific project task list
  return { message: 'Task deleted successfully' };
};

module.exports = {
  createTask,
  queryTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
};
```