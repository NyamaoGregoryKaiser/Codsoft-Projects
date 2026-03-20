const asyncHandler = require('express-async-handler');
const queryService = require('@services/queryService');
const logger = require('@utils/logger');
const prisma = require('@config/db'); // For DbInstance validation

/**
 * @desc Get all slow queries for a specific database instance
 * @route GET /api/queries/:dbInstanceId
 * @access Private (Admin/User who owns the instance)
 */
const getSlowQueries = asyncHandler(async (req, res) => {
  const { dbInstanceId } = req.params;
  const { minDuration, startDate, endDate, queryText, page, pageSize } = req.query;

  // Optional: Validate if dbInstanceId exists and user has access
  const dbInstance = await prisma.dbInstance.findUnique({ where: { id: dbInstanceId } });
  if (!dbInstance) {
    res.status(404);
    throw new Error('Database instance not found');
  }

  const filters = { minDuration, startDate, endDate, queryText };
  const currentPage = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || 10;

  const { queries, totalCount } = await queryService.getSlowQueries(dbInstanceId, filters, currentPage, size);

  res.status(200).json({
    success: true,
    message: 'Slow queries fetched successfully',
    data: queries,
    pagination: {
      total: totalCount,
      page: currentPage,
      pageSize: size,
      totalPages: Math.ceil(totalCount / size),
    },
  });
});

/**
 * @desc Get a single slow query by ID with its explanations
 * @route GET /api/queries/:dbInstanceId/:queryId
 * @access Private (Admin/User who owns the instance)
 */
const getQueryById = asyncHandler(async (req, res) => {
  const { dbInstanceId, queryId } = req.params;

  // Optional: Validate if dbInstanceId exists and user has access
  const dbInstance = await prisma.dbInstance.findUnique({ where: { id: dbInstanceId } });
  if (!dbInstance) {
    res.status(404);
    throw new Error('Database instance not found');
  }

  const query = await queryService.getQueryById(queryId);

  if (!query || query.dbInstanceId !== dbInstanceId) {
    res.status(404);
    throw new Error('Monitored query not found for this instance');
  }

  res.status(200).json({
    success: true,
    message: 'Slow query details fetched successfully',
    data: query,
  });
});

/**
 * @desc Get execution plans for a specific monitored query
 * @route GET /api/queries/:dbInstanceId/:queryId/explanations
 * @access Private (Admin/User who owns the instance)
 */
const getQueryExplanations = asyncHandler(async (req, res) => {
  const { dbInstanceId, queryId } = req.params;

  // Optional: Validate if dbInstanceId exists and user has access
  const dbInstance = await prisma.dbInstance.findUnique({ where: { id: dbInstanceId } });
  if (!dbInstance) {
    res.status(404);
    throw new Error('Database instance not found');
  }

  // Also validate the query itself belongs to the instance
  const query = await queryService.getQueryById(queryId);
  if (!query || query.dbInstanceId !== dbInstanceId) {
    res.status(404);
    throw new Error('Monitored query not found for this instance');
  }

  const explanations = await queryService.getQueryExplanations(queryId);

  res.status(200).json({
    success: true,
    message: 'Query explanations fetched successfully',
    data: explanations,
  });
});


module.exports = {
  getSlowQueries,
  getQueryById,
  getQueryExplanations,
};