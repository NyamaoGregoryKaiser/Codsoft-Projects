```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { projectService } = require('../services');
const ApiError = require('../utils/ApiError');

const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(project);
});

const getProjects = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.name) filter.name = { contains: req.query.name, mode: 'insensitive' };
  if (req.query.ownerId) filter.ownerId = req.query.ownerId;

  const options = {
    limit: req.query.limit,
    page: req.query.page,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };
  const result = await projectService.queryProjects(filter, options, req.user.id);
  res.send(result);
});

const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);
  // Ensure user is a member of the project
  const isMember = project.members.some(member => member.id === req.user.id);
  if (!project || (!isMember && req.user.role !== 'ADMIN')) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found or you are not a member');
  }
  res.send(project);
});

const updateProject = catchAsync(async (req, res) => {
  // isOwnerOrAdmin middleware already ensures user is owner or admin
  const project = await projectService.updateProjectById(req.params.projectId, req.body, req.user.id);
  res.send(project);
});

const deleteProject = catchAsync(async (req, res) => {
  // isOwnerOrAdmin middleware already ensures user is owner or admin
  await projectService.deleteProjectById(req.params.projectId, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};
```