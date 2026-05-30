```javascript
const { Task, Project, User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../config/logger.config');

const createTask = async (projectId, title, description, status, priority, dueDate, assigneeId, userId, role) => {
  try {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    if (role !== 'admin' && project.ownerId !== userId) {
      throw new AppError('Not authorized to create tasks in this project', 403);
    }

    if (assigneeId) {
      const assignee = await User.findByPk(assigneeId);
      if (!assignee) {
        throw new AppError('Assignee user not found', 404);
      }
    }

    const task = await Task.create({
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
    });
    logger.info(`Task created: '${task.title}' in project ${projectId}`);
    return task;
  } catch (error) {
    logger.error(`Error creating task for project ${projectId} by user ${userId}: ${error.message}`);
    throw error;
  }
};

const getTaskById = async (taskId, userId, role) => {
  try {
    const task = await Task.findByPk(taskId, {
      include: [
        { model: Project, as: 'project', include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'email'] }
      ]
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Authorization check: User must be project owner, assignee, or admin
    const isProjectOwner = task.project.ownerId === userId;
    const isAssignee = task.assigneeId === userId;

    if (role !== 'admin' && !isProjectOwner && !isAssignee) {
      throw new AppError('Not authorized to access this task', 403);
    }
    return task;
  } catch (error) {
    logger.error(`Error fetching task ${taskId} for user ${userId}: ${error.message}`);
    throw error;
  }
};

const updateTask = async (taskId, updates, userId, role) => {
  try {
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Authorization check: User must be project owner, assignee, or admin
    const isProjectOwner = task.project.ownerId === userId;
    const isAssignee = task.assigneeId === userId;

    if (role !== 'admin' && !isProjectOwner && !isAssignee) {
      throw new AppError('Not authorized to update this task', 403);
    }

    if (updates.assigneeId) {
      const assignee = await User.findByPk(updates.assigneeId);
      if (!assignee) {
        throw new AppError('Assignee user not found', 404);
      }
    }

    Object.assign(task, updates);
    await task.save();
    logger.info(`Task updated: '${task.title}' by user ${userId}`);
    return task;
  } catch (error) {
    logger.error(`Error updating task ${taskId} by user ${userId}: ${error.message}`);
    throw error;
  }
};

const deleteTask = async (taskId, userId, role) => {
  try {
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Authorization check: User must be project owner or admin
    const isProjectOwner = task.project.ownerId === userId;

    if (role !== 'admin' && !isProjectOwner) {
      throw new AppError('Not authorized to delete this task', 403);
    }

    await task.destroy();
    logger.info(`Task deleted: '${task.title}' by user ${userId}`);
    return { message: 'Task deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting task ${taskId} by user ${userId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
};
```