const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const targetService = require('../services/target.service');
const ApiError = require('../utils/ApiError');

const createTarget = catchAsync(async (req, res) => {
  const target = await targetService.createTarget(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(target.toJSON());
});

const getTargets = catchAsync(async (req, res) => {
  const filter = {};
  const options = {
    limit: req.query.limit || 10,
    page: req.query.page || 1,
    sortBy: req.query.sortBy || 'createdAt:desc',
  };
  if (req.user.role !== 'admin') {
    filter.userId = req.user.id; // Users can only see their own targets
  }
  if (req.query.name) filter.name = req.query.name;
  if (req.query.url) filter.url = req.query.url;

  const result = await targetService.queryTargets(filter, options);
  res.send(result);
});

const getTarget = catchAsync(async (req, res) => {
  const target = await targetService.getTargetById(req.params.targetId);
  if (req.user.role !== 'admin' && target.userId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access to this target');
  }
  res.send(target.toJSON());
});

const updateTarget = catchAsync(async (req, res) => {
  const target = await targetService.getTargetById(req.params.targetId);
  if (req.user.role !== 'admin' && target.userId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access to this target');
  }
  const updatedTarget = await targetService.updateTargetById(req.params.targetId, req.body);
  res.send(updatedTarget.toJSON());
});

const deleteTarget = catchAsync(async (req, res) => {
  const target = await targetService.getTargetById(req.params.targetId);
  if (req.user.role !== 'admin' && target.userId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access to this target');
  }
  await targetService.deleteTargetById(req.params.targetId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTarget,
  getTargets,
  getTarget,
  updateTarget,
  deleteTarget,
};