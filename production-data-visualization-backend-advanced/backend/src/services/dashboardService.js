const Dashboard = require('../models/dashboard');
const Chart = require('../models/chart');
const AppError = require('../utils/AppError');
const sequelize = require('../config/database'); // For transactions

exports.createDashboard = async (dashboardData, userId) => {
  const newDashboard = await Dashboard.create({ ...dashboardData, userId });
  return newDashboard;
};

exports.getAllDashboards = async (userId, role) => {
  if (role === 'admin') {
    return Dashboard.findAll();
  }
  return Dashboard.findAll({ where: { userId } });
};

exports.getDashboardById = async (id, userId, role) => {
  const whereClause = { id };
  if (role !== 'admin') {
    whereClause.userId = userId;
  }
  const dashboard = await Dashboard.findOne({ where: whereClause });
  if (!dashboard) {
    throw new AppError('No dashboard found with that ID', 404);
  }

  // Populate chart details if layout has chart IDs
  if (dashboard.layout && dashboard.layout.length > 0) {
    const chartIds = dashboard.layout.map(item => item.i);
    const charts = await Chart.findAll({
      where: {
        id: chartIds,
      },
      attributes: ['id', 'name', 'type', 'config', 'dataSourceId'],
    });

    // Map charts to the layout structure
    const chartsMap = new Map(charts.map(chart => [chart.id, chart.toJSON()]));
    dashboard.dataValues.charts = dashboard.layout.map(layoutItem => ({
      ...layoutItem,
      chart: chartsMap.get(layoutItem.i),
    }));
  } else {
    dashboard.dataValues.charts = [];
  }

  return dashboard;
};

exports.updateDashboard = async (id, data, userId, role) => {
  const dashboard = await exports.getDashboardById(id, userId, role); // Reuse check for ownership/admin

  // Basic validation for layout (ensure chart IDs exist, or handle gracefully)
  if (data.layout) {
    const chartIdsInLayout = data.layout.map(item => item.i);
    const existingCharts = await Chart.findAll({
      where: { id: chartIdsInLayout },
      attributes: ['id']
    });
    const existingChartIds = new Set(existingCharts.map(c => c.id));

    const invalidChartIds = chartIdsInLayout.filter(id => !existingChartIds.has(id));
    if (invalidChartIds.length > 0) {
      throw new AppError(`Charts with IDs ${invalidChartIds.join(', ')} do not exist or are inaccessible.`, 400);
    }
  }

  await dashboard.update(data);
  return dashboard;
};

exports.deleteDashboard = async (id, userId, role) => {
  const dashboard = await exports.getDashboardById(id, userId, role); // Reuse check for ownership/admin
  await dashboard.destroy();
  return null;
};