const chartService = require('../services/chartService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

exports.createChart = catchAsync(async (req, res) => {
  const chart = await chartService.createChart(req.body, req.user.id);
  res.status(201).json({
    status: 'success',
    data: { chart },
  });
  logger.info(`Chart created: ${chart.name} by user ${req.user.id}`);
});

exports.getAllCharts = catchAsync(async (req, res) => {
  const charts = await chartService.getAllCharts(req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    results: charts.length,
    data: { charts },
  });
  logger.debug(`Fetched all charts for user ${req.user.id}`);
});

exports.getChart = catchAsync(async (req, res) => {
  const chart = await chartService.getChartById(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: { chart },
  });
  logger.debug(`Fetched chart: ${req.params.id}`);
});

exports.updateChart = catchAsync(async (req, res) => {
  const chart = await chartService.updateChart(req.params.id, req.body, req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: { chart },
  });
  logger.info(`Updated chart: ${chart.name}`);
});

exports.deleteChart = catchAsync(async (req, res) => {
  await chartService.deleteChart(req.params.id, req.user.id, req.user.role);
  res.status(204).json({
    status: 'success',
    data: null,
  });
  logger.warn(`Deleted chart: ${req.params.id}`);
});

exports.getChartData = catchAsync(async (req, res) => {
  const { chartConfig, data } = await chartService.getChartDataWithConfig(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: { chartConfig, data },
  });
  logger.debug(`Fetched data for chart: ${req.params.id}`);
});