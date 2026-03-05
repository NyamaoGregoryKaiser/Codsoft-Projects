const asyncHandler = require('express-async-handler');
const metricsService = require('../services/metricsService');
const { APIError } = require('../utils/apiError');

const getLiveMetrics = asyncHandler(async (req, res, next) => {
  const { connectionId } = req.params;
  if (!connectionId) {
    throw new APIError('Connection ID is required', 400);
  }
  // The connection service implicitly checks user authorization
  const pgClient = await metricsService.getCachedPgClient(connectionId);
  const metrics = await metricsService.fetchDatabaseMetrics(pgClient);
  res.status(200).json(metrics);
});

const getMetricsHistory = asyncHandler(async (req, res, next) => {
  const { connectionId } = req.params;
  const { timeRange } = req.query; // e.g., '1h', '24h', '7d', '30d'
  const history = await metricsService.getMetricsHistory(req.user.id, connectionId, timeRange);
  res.status(200).json(history);
});

// Endpoint to manually trigger metrics recording (for testing/ad-hoc)
const recordMetrics = asyncHandler(async (req, res, next) => {
  const { connectionId } = req.params;
  if (!connectionId) {
    throw new APIError('Connection ID is required', 400);
  }
  const recorded = await metricsService.recordMetrics(req.user.id, connectionId);
  res.status(201).json({ message: 'Metrics recorded successfully', data: recorded });
});

module.exports = {
  getLiveMetrics,
  getMetricsHistory,
  recordMetrics,
};