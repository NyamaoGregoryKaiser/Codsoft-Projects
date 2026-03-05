const asyncHandler = require('express-async-handler');
const schemaService = require('../services/schemaService');
const { APIError } = require('../utils/apiError');

const getTables = asyncHandler(async (req, res, next) => {
  const { connectionId } = req.params;
  if (!connectionId) {
    throw new APIError('Connection ID is required', 400);
  }
  const tables = await schemaService.getTables(connectionId);
  res.status(200).json(tables);
});

const getTableDetails = asyncHandler(async (req, res, next) => {
  const { connectionId, schemaName, tableName } = req.params;
  if (!connectionId || !schemaName || !tableName) {
    throw new APIError('Connection ID, schema name, and table name are required', 400);
  }
  const details = await schemaService.getTableDetails(connectionId, schemaName, tableName);
  res.status(200).json(details);
});

module.exports = {
  getTables,
  getTableDetails,
};