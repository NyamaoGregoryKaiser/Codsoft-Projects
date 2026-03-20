const asyncHandler = require('express-async-handler');
const indexService = require('@services/indexService');
const logger = require('@utils/logger');
const prisma = require('@config/db'); // For DbInstance validation

/**
 * @desc Get all index suggestions for a specific database instance
 * @route GET /api/indexes/:dbInstanceId
 * @access Private (Admin/User who owns the instance)
 */
const getIndexSuggestions = asyncHandler(async (req, res) => {
  const { dbInstanceId } = req.params;
  const { status, tableName } = req.query;

  // Optional: Validate if dbInstanceId exists and user has access
  const dbInstance = await prisma.dbInstance.findUnique({ where: { id: dbInstanceId } });
  if (!dbInstance) {
    res.status(404);
    throw new Error('Database instance not found');
  }

  const filters = { status, tableName };
  const suggestions = await indexService.getIndexSuggestions(dbInstanceId, filters);

  res.status(200).json({
    success: true,
    message: 'Index suggestions fetched successfully',
    data: suggestions,
  });
});

/**
 * @desc Update the status of an index suggestion
 * @route PUT /api/indexes/:dbInstanceId/:suggestionId/status
 * @access Private (Admin role usually, or specific user permission)
 */
const updateIndexSuggestionStatus = asyncHandler(async (req, res) => {
  const { dbInstanceId, suggestionId } = req.params;
  const { status } = req.body; // status: 'applied', 'dismissed', 'pending'

  if (!status) {
    res.status(400);
    throw new Error('Status field is required.');
  }

  // Optional: Validate if dbInstanceId exists and user has access
  const dbInstance = await prisma.dbInstance.findUnique({ where: { id: dbInstanceId } });
  if (!dbInstance) {
    res.status(404);
    throw new Error('Database instance not found');
  }

  const updatedSuggestion = await indexService.updateIndexSuggestionStatus(suggestionId, status);

  res.status(200).json({
    success: true,
    message: `Index suggestion ${suggestionId} status updated to ${status}`,
    data: updatedSuggestion,
  });
});

module.exports = {
  getIndexSuggestions,
  updateIndexSuggestionStatus,
};