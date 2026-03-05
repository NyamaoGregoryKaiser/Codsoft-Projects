const dashboardService = require('../services/dashboardService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

exports.createDashboard = catchAsync(async (req, res) => {
  const dashboard = await dashboardService.createDashboard(req.body, req.user.id);
  res.status(201).json({
    status: 'success',
    data: { dashboard },
  });
  logger.info(`Dashboard created: ${dashboard.name} by user ${req.user.id}`);
});

exports.getAllDashboards = catchAsync(async (req, res) => {
  const dashboards = await dashboardService.getAllDashboards(req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    results: dashboards.length,
    data: { dashboards },
  });
  logger.debug(`Fetched all dashboards for user ${req.user.id}`);
});

exports.getDashboard = catchAsync(async (req, res) => {
  const dashboard = await dashboardService.getDashboardById(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: { dashboard },
  });
  logger.debug(`Fetched dashboard: ${req.params.id}`);
});

exports.updateDashboard = catchAsync(async (req, res) => {
  const dashboard = await dashboardService.updateDashboard(req.params.id, req.body, req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: { dashboard },
  });
  logger.info(`Updated dashboard: ${dashboard.name}`);
});

exports.deleteDashboard = catchAsync(async (req, res) => {
  await dashboardService.deleteDashboard(req.params.id, req.user.id, req.user.role);
  res.status(204).json({
    status: 'success',
    data: null,
  });
  logger.warn(`Deleted dashboard: ${req.params.id}`);
});