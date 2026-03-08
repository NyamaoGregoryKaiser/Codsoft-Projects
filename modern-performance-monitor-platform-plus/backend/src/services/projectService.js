```javascript
const { v4: uuidv4 } = require('uuid');
const { projectRepository } = require('../data-access/repositories');
const httpStatus = require('http-status');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const createProject = async (userId, projectBody) => {
  // Generate a unique API key for the project
  const apiKey = uuidv4(); // Simple UUID, could be more complex/secure
  const newProject = {
    id: uuidv4(),
    user_id: userId,
    name: projectBody.name,
    description: projectBody.description,
    api_key: apiKey,
  };
  const project = await projectRepository.create(newProject);
  logger.info(`Project created: ${project.name} by user ${userId}`);
  return project;
};

const getProjectById = async (projectId, userId) => {
  const project = await projectRepository.findById(projectId);
  if (!project || project.user_id !== userId) {
    throw new ApiError('Project not found or unauthorized', httpStatus.NOT_FOUND);
  }
  return project;
};

const getProjectsByUserId = async (userId) => {
  return projectRepository.findByUserId(userId);
};

const updateProject = async (projectId, userId, updateBody) => {
  const project = await getProjectById(projectId, userId); // Ensures user owns project
  const updatedProject = await projectRepository.update(projectId, updateBody);
  logger.info(`Project updated: ${project.name} by user ${userId}`);
  return updatedProject;
};

const deleteProject = async (projectId, userId) => {
  const project = await getProjectById(projectId, userId); // Ensures user owns project
  await projectRepository.remove(projectId);
  logger.info(`Project deleted: ${project.name} by user ${userId}`);
  return { message: 'Project deleted successfully' };
};

const generateNewApiKey = async (projectId, userId) => {
  const project = await getProjectById(projectId, userId); // Ensures user owns project
  const newApiKey = uuidv4();
  const updatedProject = await projectRepository.update(projectId, { api_key: newApiKey });
  logger.info(`New API Key generated for project: ${project.name} by user ${userId}`);
  return updatedProject;
};

module.exports = {
  createProject,
  getProjectById,
  getProjectsByUserId,
  updateProject,
  deleteProject,
  generateNewApiKey,
};
```