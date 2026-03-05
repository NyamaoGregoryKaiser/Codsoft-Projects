const DataSource = require('../models/dataSource');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

exports.createDataSource = async (data, userId) => {
  const newDataSource = await DataSource.create({ ...data, userId });
  return newDataSource;
};

exports.getAllDataSources = async (userId, role) => {
  if (role === 'admin') {
    return DataSource.findAll();
  }
  return DataSource.findAll({ where: { userId } });
};

exports.getDataSourceById = async (id, userId, role) => {
  const whereClause = { id };
  if (role !== 'admin') {
    whereClause.userId = userId;
  }
  const dataSource = await DataSource.findOne({ where: whereClause });
  if (!dataSource) {
    throw new AppError('No data source found with that ID', 404);
  }
  return dataSource;
};

exports.updateDataSource = async (id, data, userId, role) => {
  const dataSource = await exports.getDataSourceById(id, userId, role); // Reuse check for ownership/admin

  await dataSource.update(data);
  return dataSource;
};

exports.deleteDataSource = async (id, userId, role) => {
  const dataSource = await exports.getDataSourceById(id, userId, role); // Reuse check for ownership/admin
  await dataSource.destroy();
  return null;
};

exports.getDataSourceData = async (id, userId, role) => {
  const dataSource = await exports.getDataSourceById(id, userId, role);

  // In a real application, this would involve connecting to external APIs, reading files, etc.
  // For this demo, we'll return the 'mock_data' from its config.
  if (dataSource.type === 'mock_data' && dataSource.config && dataSource.config.data) {
    return dataSource.config.data;
  } else if (dataSource.type === 'csv_upload') {
    // Simulate reading CSV. In real app, this would involve file storage like S3.
    // dataSource.config.filePath
    throw new AppError('CSV data source type not fully implemented in demo.', 501);
  } else if (dataSource.type === 'api_endpoint') {
    // Simulate fetching from an API. Use axios, etc.
    // dataSource.config.apiUrl, dataSource.config.headers
    throw new AppError('API endpoint data source type not fully implemented in demo.', 501);
  } else if (dataSource.type === 'database_query') {
    // Simulate running a database query. Be very careful with this in production!
    // dataSource.config.query
    throw new AppError('Database query data source type not fully implemented in demo.', 501);
  } else {
    throw new AppError('Data source type not supported or missing data configuration.', 400);
  }
};