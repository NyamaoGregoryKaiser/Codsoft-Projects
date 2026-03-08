```javascript
const httpStatus = require('http-status');
const { projectService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(project);
});

const getProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getProjectsByUserId(req.user.id);
  res.send(projects);
});

const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId, req.user.id);
  res.send(project);
});

const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(req.params.projectId, req.user.id, req.body);
  res.send(project);
});

const deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProject(req.params.projectId, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const generateNewApiKey = catchAsync(async (req, res) => {
  const project = await projectService.generateNewApiKey(req.params.projectId, req.user.id);
  res.send(project);
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  generateNewApiKey,
};
```