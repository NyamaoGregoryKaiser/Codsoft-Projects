const prisma = require('@config/db');
const logger = require('@utils/logger');
const { getOrSetCache } = require('@utils/cache');

/**
 * Fetches all monitored slow queries for a given database instance.
 * @param {string} dbInstanceId - The ID of the database instance.
 * @param {object} filters - Filters like duration, startDate, endDate.
 * @param {number} [page=1] - Current page number.
 * @param {number} [pageSize=10] - Number of items per page.
 * @returns {Promise<object>} Paginated list of slow queries and total count.
 */
const getSlowQueries = async (dbInstanceId, filters = {}, page = 1, pageSize = 10) => {
  const skip = (page - 1) * pageSize;
  const where = { dbInstanceId };

  if (filters.minDuration) {
    where.durationMs = { gte: parseInt(filters.minDuration, 10) };
  }
  if (filters.startDate || filters.endDate) {
    where.occurredAt = {};
    if (filters.startDate) where.occurredAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.occurredAt.lte = new Date(filters.endDate);
  }
  if (filters.queryText) {
    where.queryText = { contains: filters.queryText, mode: 'insensitive' };
  }

  const cacheKey = `slowQueries:${dbInstanceId}:${JSON.stringify(filters)}:page=${page}:size=${pageSize}`;
  return getOrSetCache(cacheKey, async () => {
    logger.debug(`Fetching slow queries for dbInstanceId: ${dbInstanceId} from DB`);
    const [queries, totalCount] = await prisma.$transaction([
      prisma.monitoredQuery.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.monitoredQuery.count({ where }),
    ]);

    return { queries, totalCount, page, pageSize };
  });
};

/**
 * Fetches a single monitored query by its ID.
 * @param {string} queryId - The ID of the monitored query.
 * @returns {Promise<object|null>} The monitored query or null if not found.
 */
const getQueryById = async (queryId) => {
  const cacheKey = `query:${queryId}`;
  return getOrSetCache(cacheKey, async () => {
    logger.debug(`Fetching query by ID: ${queryId} from DB`);
    const query = await prisma.monitoredQuery.findUnique({
      where: { id: queryId },
      include: {
        queryExplanation: true, // Include related explanations
      },
    });
    return query;
  });
};

/**
 * Fetches all execution plans for a given monitored query.
 * @param {string} monitoredQueryId - The ID of the monitored query.
 * @returns {Promise<object[]>} An array of query explanations.
 */
const getQueryExplanations = async (monitoredQueryId) => {
  const cacheKey = `queryExplanations:${monitoredQueryId}`;
  return getOrSetCache(cacheKey, async () => {
    logger.debug(`Fetching query explanations for monitoredQueryId: ${monitoredQueryId} from DB`);
    const explanations = await prisma.queryExplanation.findMany({
      where: { monitoredQueryId },
      orderBy: { createdAt: 'asc' },
    });
    return explanations;
  });
};

module.exports = {
  getSlowQueries,
  getQueryById,
  getQueryExplanations,
};