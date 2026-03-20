const prisma = require('@config/db');
const logger = require('@utils/logger');
const { getOrSetCache } = require('@utils/cache');

/**
 * Fetches the latest metric snapshot for a given database instance.
 * @param {string} dbInstanceId - The ID of the database instance.
 * @returns {Promise<object|null>} The latest metric snapshot or null if none found.
 */
const getLatestMetrics = async (dbInstanceId) => {
  const cacheKey = `latestMetrics:${dbInstanceId}`;
  return getOrSetCache(cacheKey, async () => {
    logger.debug(`Fetching latest metrics for dbInstanceId: ${dbInstanceId} from DB`);
    const metrics = await prisma.metricSnapshot.findFirst({
      where: { dbInstanceId },
      orderBy: { timestamp: 'desc' },
    });
    return metrics;
  });
};

/**
 * Fetches metric history for a given database instance within a time range.
 * @param {string} dbInstanceId - The ID of the database instance.
 * @param {Date} startTime - The start time for the history.
 * @param {Date} endTime - The end time for the history.
 * @param {number} [limit=100] - Maximum number of metrics to return.
 * @returns {Promise<object[]>} An array of metric snapshots.
 */
const getMetricHistory = async (dbInstanceId, startTime, endTime, limit = 100) => {
  const cacheKey = `metricsHistory:${dbInstanceId}:${startTime.toISOString()}:${endTime.toISOString()}:${limit}`;
  return getOrSetCache(cacheKey, async () => {
    logger.debug(`Fetching metric history for dbInstanceId: ${dbInstanceId} from DB`);
    const metrics = await prisma.metricSnapshot.findMany({
      where: {
        dbInstanceId,
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });
    return metrics;
  });
};

module.exports = {
  getLatestMetrics,
  getMetricHistory,
};