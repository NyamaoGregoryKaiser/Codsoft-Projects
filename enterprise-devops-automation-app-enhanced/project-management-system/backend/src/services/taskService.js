```javascript
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Task, Project, User, Comment } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a task
 * @param {Object} taskBody
 * @returns {Promise<Task>}
 */
const createTask = async (taskBody) => {
  const task = await Task.create(taskBody);
  return task;
};

/**
 * Query for tasks
 * @param {Object} filter - Sequelize filter
 * @returns {Promise<Task[]>}
 */
const queryTasks = async (filter) => {
  const where = {};
  if (filter.projectId) where.projectId = filter.projectId;
  if (filter.assignedTo) where.assignedTo = filter.assignedTo;
  if (filter.status) where.status = filter.status;
  if (filter.priority) where.priority = filter.priority;

  const tasks = await Task.findAll({
    where,
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name'] },
      { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
      { model: Comment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
    ],
    order: [['createdAt', 'ASC']],
  });
  return tasks;
};

/**
 * Get task by id
 * @param {UUID} id
 * @returns {Promise<Task>}
 */
const getTaskById = async (id) => {
  return Task.findByPk(id, {
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'ownerId'] },
      { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
      { model: Comment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
    ],
  });
};

/**
 * Update task by id
 * @param {UUID} taskId
 * @param {Object} updateBody
 * @param {User} currentUser
 * @returns {Promise<Task>}
 */
const updateTaskById = async (taskId, updateBody, currentUser) => {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  const project = await task.getProject(); // Get the associated project
  const isMember = project.members.some(member => member.id === currentUser.id);
  const isOwner = project.ownerId === currentUser.id;

  if (!isMember && !isOwner && currentUser.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update tasks in projects you are a member of');
  }

  // Ensure 'assignedTo' user is a member of the project
  if (updateBody.assignedTo) {
    const assignee = await User.findByPk(updateBody.assignedTo);
    if (!assignee) throw new ApiError(httpStatus.NOT_FOUND, 'Assignee user not found');

    const projectMembers = await project.getMembers();
    const isAssigneeAMember = projectMembers.some(member => member.id === assignee.id);
    if (!isAssigneeAMember && assignee.id !== project.ownerId) { // Owner is implicitly a member
      throw new ApiError(httpStatus.BAD_REQUEST, 'Assigned user must be a member or owner of the project');
    }
  }

  Object.assign(task, updateBody);
  await task.save();
  return task;
};

/**
 * Delete task by id
 * @param {UUID} taskId
 * @param {User} currentUser
 * @returns {Promise<Task>}
 */
const deleteTaskById = async (taskId, currentUser) => {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  const project = await task.getProject();
  if (project.ownerId !== currentUser.id && currentUser.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only project owner or admin can delete tasks');
  }

  await task.destroy();
  return task;
};

module.exports = {
  createTask,
  queryTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
};
```