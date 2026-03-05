const Chart = require('../models/chart');
const DataSource = require('../models/dataSource');
const dataSourceService = require('./dataSourceService');
const AppError = require('../utils/AppError');

exports.createChart = async (chartData, userId) => {
  const newChart = await Chart.create({ ...chartData, userId });
  return newChart;
};

exports.getAllCharts = async (userId, role) => {
  if (role === 'admin') {
    return Chart.findAll({ include: [{ model: DataSource, as: 'dataSource', attributes: ['name', 'type'] }] });
  }
  return Chart.findAll({
    where: { userId },
    include: [{ model: DataSource, as: 'dataSource', attributes: ['name', 'type'] }],
  });
};

exports.getChartById = async (id, userId, role) => {
  const whereClause = { id };
  if (role !== 'admin') {
    whereClause.userId = userId;
  }
  const chart = await Chart.findOne({
    where: whereClause,
    include: [{ model: DataSource, as: 'dataSource', attributes: ['name', 'type', 'config'] }],
  });
  if (!chart) {
    throw new AppError('No chart found with that ID', 404);
  }
  return chart;
};

exports.updateChart = async (id, data, userId, role) => {
  const chart = await exports.getChartById(id, userId, role);
  await chart.update(data);
  return chart;
};

exports.deleteChart = async (id, userId, role) => {
  const chart = await exports.getChartById(id, userId, role);
  await chart.destroy();
  return null;
};

exports.getChartDataWithConfig = async (chartId, userId, role) => {
  const chart = await exports.getChartById(chartId, userId, role);

  if (!chart.dataSource) {
    throw new AppError('Chart is not linked to a data source.', 400);
  }

  // Fetch raw data from the linked data source
  const rawData = await dataSourceService.getDataSourceData(chart.dataSource.id, userId, role);

  // Apply basic transformation based on chart type and config (simplified for demo)
  // In a real app, this would be a more sophisticated data processing engine
  let processedData = rawData;
  if (chart.type === 'pie' && chart.config.series && chart.config.series[0] && chart.config.series[0].data) {
    // E.g., if pie chart config expects [{ value: X, name: Y }]
    // For our seed data example, it's already structured correctly.
    // If not, we'd need to map rawData to this format based on chart.config.
  }
  // For bar/line charts, Echarts options typically handle direct array mapping
  // so `rawData` can often be directly used in the `series` or `xAxis` data.

  // For this demo, we assume chart.config is largely complete and `rawData` is ready for consumption
  // or simple direct mapping. The crucial part is fetching the data source correctly.

  return {
    chartConfig: chart.config,
    data: processedData, // Raw data, typically consumed by frontend and mapped to chart options
  };
};