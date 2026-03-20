const prisma = require('@config/db');
const logger = require('@utils/logger');
const { getOrSetCache } = require('@utils/cache');

/**
 * Fetches all index suggestions for a given database instance.
 * @param {string} dbInstanceId - The ID of the database instance.
 * @param {object} filters - Filters for status (e.g., 'pending', 'applied', 'dismissed').
 * @returns {Promise<object[]>} An array of index suggestions.
 */
const getIndexSuggestions = async (dbInstanceId, filters = {}) => {
  const where = { dbInstanceId };
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.tableName) {
    where.tableName = { contains: filters.tableName, mode: 'insensitive' };
  }

  const cacheKey = `indexSuggestions:${dbInstanceId}:${JSON.stringify(filters)}`;
  return getOrSetCache(cacheKey, async () => {
    logger.debug(`Fetching index suggestions for dbInstanceId: ${dbInstanceId} from DB`);
    const suggestions = await prisma.indexSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        MonitoredQuery: {
          select: { id: true, queryText: true, durationMs: true },
        },
      },
    });
    return suggestions;
  });
};

/**
 * Updates the status of an index suggestion.
 * @param {string} suggestionId - The ID of the index suggestion.
 * @param {string} status - The new status (e.g., 'applied', 'dismissed').
 * @returns {Promise<object>} The updated index suggestion.
 * @throws {Error} If the suggestion is not found or status is invalid.
 */
const updateIndexSuggestionStatus = async (suggestionId, status) => {
  const validStatuses = ['pending', 'applied', 'dismissed'];
  if (!validStatuses.includes(status)) {
    logger.warn(`Invalid status update attempt for index suggestion ${suggestionId}: ${status}`);
    throw new Error('Invalid status provided.');
  }

  const updatedSuggestion = await prisma.indexSuggestion.update({
    where: { id: suggestionId },
    data: { status },
  });

  if (!updatedSuggestion) {
    logger.error(`Failed to update index suggestion ${suggestionId}: not found.`);
    throw new Error('Index suggestion not found.');
  }

  // Invalidate cache for this dbInstance after update
  const dbInstanceId = updatedSuggestion.dbInstanceId;
  delCache(`indexSuggestions:${dbInstanceId}`);
  logger.info(`Updated index suggestion ${suggestionId} status to ${status}.`);
  return updatedSuggestion;
};

module.exports = {
  getIndexSuggestions,
  updateIndexSuggestionStatus,
};