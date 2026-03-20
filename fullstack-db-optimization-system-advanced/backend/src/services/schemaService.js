const prisma = require('@config/db');
const logger = require('@utils/logger');
const { getOrSetCache } = require('@utils/cache');

/**
 * Fetches all schema issues for a given database instance.
 * @param {string} dbInstanceId - The ID of the database instance.
 * @param {object} filters - Filters for status or severity.
 * @returns {Promise<object[]>} An array of schema issues.
 */
const getSchemaIssues = async (dbInstanceId, filters = {}) => {
  const where = { dbInstanceId };
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.severity) {
    where.severity = filters.severity;
  }
  if (filters.issueType) {
    where.issueType = { contains: filters.issueType, mode: 'insensitive' };
  }

  const cacheKey = `schemaIssues:${dbInstanceId}:${JSON.stringify(filters)}`;
  return getOrSetCache(cacheKey, async () => {
    logger.debug(`Fetching schema issues for dbInstanceId: ${dbInstanceId} from DB`);
    const issues = await prisma.schemaIssue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return issues;
  });
};

/**
 * Updates the status of a schema issue.
 * @param {string} issueId - The ID of the schema issue.
 * @param {string} status - The new status (e.g., 'resolved', 'ignored', 'open').
 * @returns {Promise<object>} The updated schema issue.
 * @throws {Error} If the issue is not found or status is invalid.
 */
const updateSchemaIssueStatus = async (issueId, status) => {
  const validStatuses = ['open', 'resolved', 'ignored'];
  if (!validStatuses.includes(status)) {
    logger.warn(`Invalid status update attempt for schema issue ${issueId}: ${status}`);
    throw new Error('Invalid status provided.');
  }

  const updatedIssue = await prisma.schemaIssue.update({
    where: { id: issueId },
    data: { status },
  });

  if (!updatedIssue) {
    logger.error(`Failed to update schema issue ${issueId}: not found.`);
    throw new Error('Schema issue not found.');
  }

  // Invalidate cache for this dbInstance after update
  const dbInstanceId = updatedIssue.dbInstanceId;
  delCache(`schemaIssues:${dbInstanceId}`);
  logger.info(`Updated schema issue ${issueId} status to ${status}.`);
  return updatedIssue;
};

module.exports = {
  getSchemaIssues,
  updateSchemaIssueStatus,
};