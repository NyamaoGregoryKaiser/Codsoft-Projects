```javascript
const httpStatus = require('http-status');
const prisma = require('../../database/prisma');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Create a task
 * @param {Object} taskBody
 * @returns {Promise<Task>}
 */
const createTask = async (taskBody) => {
  logger.info(`Creating task for project: ${taskBody.projectId}`);
  const task = await prisma.task.create({
    data: taskBody,
  });
  return task;
};

/**
 * Query for tasks
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTasks = async (filter, options) => {
  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  const orderBy = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    orderBy[parts[0]] = parts[1];
  } else {
    orderBy.createdAt = 'desc'; // Default sort
  }

  const tasks = await prisma.task.findMany({
    where: filter,
    take: limit,
    skip: skip,
    orderBy: orderBy,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true }, // Select specific fields from assigned user
      },
    },
  });

  const totalResults = await prisma.task.count({ where: filter });
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: tasks,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Get task by id
 * @param {string} id
 * @returns {Promise<Task>}
 */
const getTaskById = async (id) => {
  return prisma.task.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  });
};

/**
 * Update task by id
 * @param {string} taskId
 * @param {Object} updateBody
 * @returns {Promise<Task>}
 */
const updateTaskById = async (taskId, updateBody) => {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateBody,
  });
  return updatedTask;
};

/**
 * Delete task by id
 * @param {string} taskId
 * @returns {Promise<Task>}
 */
const deleteTaskById = async (taskId) => {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }
  await prisma.task.delete({
    where: { id: taskId },
  });
  return task; // Return the deleted task (or confirmation)
};

module.exports = {
  createTask,
  queryTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
};
```