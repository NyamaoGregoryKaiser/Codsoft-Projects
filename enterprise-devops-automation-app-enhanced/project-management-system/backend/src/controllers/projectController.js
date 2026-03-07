```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { projectService } = require('../services');
const { redisClient } = require('../config/redis'); // Assuming redisClient is exported

const createProject = catchAsync(async (req, res) => {
  req.body.ownerId = req.user.id; // Set current user as project owner
  const project = await projectService.createProject(req.body);
  await redisClient.del('all_projects'); // Invalidate cache
  res.status(httpStatus.CREATED).send(project);
});

const getProjects = catchAsync(async (req, res) => {
  const cachedProjects = await redisClient.get('all_projects');
  if (cachedProjects) {
    return res.send(JSON.parse(cachedProjects));
  }

  // Filter for projects where the user is either the owner or a member
  const projects = await projectService.queryProjects({ userId: req.user.id, role: req.user.role });
  await redisClient.setEx('all_projects', 3600, JSON.stringify(projects)); // Cache for 1 hour
  res.send(projects);
});

const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  // Ensure the user is either the owner or a member
  const isMember = project.members.some(member => member.id === req.user.id);
  const isOwner = project.ownerId === req.user.id;

  if (!isMember && !isOwner && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access to project forbidden');
  }
  res.send(project);
});

const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProjectById(req.params.projectId, req.body, req.user);
  await redisClient.del('all_projects'); // Invalidate cache
  res.send(project);
});

const deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProjectById(req.params.projectId, req.user);
  await redisClient.del('all_projects'); // Invalidate cache
  res.status(httpStatus.NO_CONTENT).send();
});

// Project members management
const addProjectMember = catchAsync(async (req, res) => {
  const project = await projectService.addMemberToProject(req.params.projectId, req.body.userId, req.user);
  await redisClient.del('all_projects');
  res.send(project);
});

const removeProjectMember = catchAsync(async (req, res) => {
  const project = await projectService.removeMemberFromProject(req.params.projectId, req.body.userId, req.user);
  await redisClient.del('all_projects');
  res.send(project);
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};
```