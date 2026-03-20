const asyncHandler = require('express-async-handler');
const schemaService = require('@services/schemaService');
const logger = require('@utils/logger');
const prisma = require('@config/db'); // For DbInstance validation

/**
 * @desc Get all schema issues for a specific database instance
 * @route GET /api/schemas/:dbInstanceId
 * @access Private (Admin/User who owns the instance)
 */
const getSchemaIssues = asyncHandler(async (req, res) => {
  const { dbInstanceId } = req.params;
  const { status, severity, issueType } = req.query;

  // Optional: Validate if dbInstanceId exists and user has access
  const dbInstance = await prisma.dbInstance.findUnique({ where: { id: dbInstanceId } });
  if (!dbInstance) {
    res.status(404);
    throw new Error('Database instance not found');
  }

  const filters = { status, severity, issueType };
  const issues = await schemaService.getSchemaIssues(dbInstanceId, filters);

  res.status(200).json({
    success: true,
    message: 'Schema issues fetched successfully',
    data: issues,
  });
});

/**
 * @desc Update the status of a schema issue
 * @route PUT /api/schemas/:dbInstanceId/:issueId/status
 * @access Private (Admin role usually, or specific user permission)
 */
const updateSchemaIssueStatus = asyncHandler(async (req, res) => {
  const { dbInstanceId, issueId } = req.params;
  const { status } = req.body; // status: 'open', 'resolved', 'ignored'

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

  const updatedIssue = await schemaService.updateSchemaIssueStatus(issueId, status);

  res.status(200).json({
    success: true,
    message: `Schema issue ${issueId} status updated to ${status}`,
    data: updatedIssue,
  });
});

module.exports = {
  getSchemaIssues,
  updateSchemaIssueStatus,
};