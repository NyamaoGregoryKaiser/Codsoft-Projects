const asyncHandler = require('express-async-handler');
const metricService = require('@services/metricService');
const logger = require('@utils/logger');
const prisma = require('@config/db'); // For DbInstance validation

/**
 * @desc Get the latest database performance metrics for a specific instance
 * @route GET /api/metrics/:dbInstanceId/latest
 * @access Private (Admin/User who owns the instance)
 */
const getLatestMetrics = asyncHandler(async (req, res) => {
  const { dbInstanceId } = req.params;

  // Optional: Validate if dbInstanceId exists and user has access
  const dbInstance = await prisma.dbInstance.findUnique({ where: { id: dbInstanceId } });
  if (!dbInstance) {
    res.status(404);
    throw new Error('Database instance not found');
  }
  // Implement authorization check if needed: e.g., if (dbInstance.ownerId !== req.user.id)

  const metrics = await metricService.getLatestMetrics(dbInstanceId);

  if (!metrics) {
    res.status(404).json({ success: false, message: 'No metrics found for this instance' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Latest metrics fetched successfully',
    data: metrics,
  });
});

/**
 * @desc Get historical database performance metrics for a specific instance
 * @route GET /api/metrics/:dbInstanceId/history
 * @access Private (Admin/User who owns the instance)
 */
const getMetricHistory = asyncHandler(async (req, res) => {
  const { dbInstanceId } = req.params;
  const { startDate, endDate, limit } = req.query;

  // Optional: Validate if dbInstanceId exists and user has access
  const dbInstance = await prisma.dbInstance.findUnique({ where: { id: dbInstanceId } });
  if (!dbInstance) {
    res.status(404);
    throw new Error('Database instance not found');
  }

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
  const end = endDate ? new Date(endDate) : new Date();
  const dataLimit = limit ? parseInt(limit, 10) : 100;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400);
    throw new Error('Invalid date format for startDate or endDate');
  }

  const history = await metricService.getMetricHistory(dbInstanceId, start, end, dataLimit);

  res.status(200).json({
    success: true,
    message: 'Metric history fetched successfully',
    data: history,
  });
});

module.exports = {
  getLatestMetrics,
  getMetricHistory,
};