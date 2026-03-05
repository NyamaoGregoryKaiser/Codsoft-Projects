const asyncHandler = require('express-async-handler');
const queryAnalysisService = require('../services/queryAnalysisService');
const { APIError } = require('../utils/apiError');

const analyzeQuery = asyncHandler(async (req, res, next) => {
  const { connectionId, query } = req.body;
  if (!connectionId || !query) {
    throw new APIError('Connection ID and query are required', 400);
  }
  // This automatically checks if the user owns the connection inside the service layer
  const analysisResult = await queryAnalysisService.analyzeQuery(req.user.id, connectionId, query);
  res.status(200).json(analysisResult);
});

const getAnalysisHistory = asyncHandler(async (req, res, next) => {
  const { connectionId } = req.params;
  const history = await queryAnalysisService.getAnalysisHistory(req.user.id, connectionId);
  res.status(200).json(history);
});

const getAnalysisDetails = asyncHandler(async (req, res, next) => {
  const { analysisId } = req.params;
  const details = await queryAnalysisService.getAnalysisDetails(analysisId);
  // Optional: check if the user owns this analysis via connectionId
  // For now, assuming if they have analysisId, it's theirs or admin
  res.status(200).json(details);
});

const updateSuggestion = asyncHandler(async (req, res, next) => {
  const { suggestionId } = req.params;
  const { status } = req.body; // e.g., 'applied', 'dismissed', 'pending'
  if (!status) {
    throw new APIError('Suggestion status is required', 400);
  }
  // Add more robust authorization here if needed (e.g., only user who created or admin)
  const updated = await queryAnalysisService.updateSuggestionStatus(suggestionId, status);
  res.status(200).json(updated);
});

module.exports = {
  analyzeQuery,
  getAnalysisHistory,
  getAnalysisDetails,
  updateSuggestion,
};