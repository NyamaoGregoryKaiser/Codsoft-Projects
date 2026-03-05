const dataSourceService = require('../services/dataSourceService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

exports.createDataSource = catchAsync(async (req, res) => {
  const dataSource = await dataSourceService.createDataSource(req.body, req.user.id);
  res.status(201).json({
    status: 'success',
    data: { dataSource },
  });
  logger.info(`Data source created: ${dataSource.name} by user ${req.user.id}`);
});

exports.getAllDataSources = catchAsync(async (req, res) => {
  const dataSources = await dataSourceService.getAllDataSources(req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    results: dataSources.length,
    data: { dataSources },
  });
  logger.debug(`Fetched all data sources for user ${req.user.id}`);
});

exports.getDataSource = catchAsync(async (req, res) => {
  const dataSource = await dataSourceService.getDataSourceById(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: { dataSource },
  });
  logger.debug(`Fetched data source: ${req.params.id}`);
});

exports.updateDataSource = catchAsync(async (req, res) => {
  const dataSource = await dataSourceService.updateDataSource(req.params.id, req.body, req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: { dataSource },
  });
  logger.info(`Updated data source: ${dataSource.name}`);
});

exports.deleteDataSource = catchAsync(async (req, res) => {
  await dataSourceService.deleteDataSource(req.params.id, req.user.id, req.user.role);
  res.status(204).json({
    status: 'success',
    data: null,
  });
  logger.warn(`Deleted data source: ${req.params.id}`);
});

exports.getDataSourceData = catchAsync(async (req, res, next) => {
  const data = await dataSourceService.getDataSourceData(req.params.id, req.user.id, req.user.role);
  res.status(200).json({
    status: 'success',
    data: { data },
  });
  logger.debug(`Fetched data for data source: ${req.params.id}`);
});