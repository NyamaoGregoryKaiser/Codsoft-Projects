```javascript
const { Project, User, Task } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../config/logger.config');

const createProject = async (name, description, ownerId) => {
  try {
    const project = await Project.create({ name, description, ownerId });
    logger.info(`Project created: ${project.name} by user ${ownerId}`);
    return project;
  } catch (error) {
    logger.error(`Error creating project for owner ${ownerId}: ${error.message}`);
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Project with this name already exists.', 400);
    }
    throw error;
  }
};

const getAllProjects = async (userId, role) => {
  try {
    let whereClause = {};
    if (role !== 'admin') {
      whereClause = { ownerId: userId };
    }
    const projects = await Project.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'email'] },
        { model: Task, as: 'tasks', attributes: ['id', 'title', 'status'] }
      ]
    });
    return projects;
  } catch (error) {
    logger.error(`Error fetching all projects for user ${userId}: ${error.message}`);
    throw error;
  }
};

const getProjectById = async (projectId, userId, role) => {
  try {
    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'email'] },
        { model: Task, as: 'tasks', include: [{ model: User, as: 'assignee', attributes: ['id', 'username'] }] }
      ]
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (role !== 'admin' && project.ownerId !== userId) {
      throw new AppError('Not authorized to access this project', 403);
    }
    return project;
  } catch (error) {
    logger.error(`Error fetching project ${projectId} for user ${userId}: ${error.message}`);
    throw error;
  }
};

const updateProject = async (projectId, updates, userId, role) => {
  try {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (role !== 'admin' && project.ownerId !== userId) {
      throw new AppError('Not authorized to update this project', 403);
    }

    Object.assign(project, updates);
    await project.save();
    logger.info(`Project updated: ${project.name} by user ${userId}`);
    return project;
  } catch (error) {
    logger.error(`Error updating project ${projectId} by user ${userId}: ${error.message}`);
    throw error;
  }
};

const deleteProject = async (projectId, userId, role) => {
  try {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (role !== 'admin' && project.ownerId !== userId) {
      throw new AppError('Not authorized to delete this project', 403);
    }

    await project.destroy();
    logger.info(`Project deleted: ${project.name} by user ${userId}`);
    return { message: 'Project deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting project ${projectId} by user ${userId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
```