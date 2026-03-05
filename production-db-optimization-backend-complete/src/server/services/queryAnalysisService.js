const knex = require('../db/knex');
const { getCachedPgClient } = require('./connectionService');
const { parseExplainOutput } = require('../utils/explainPlanParser');
const logger = require('../utils/logger');
const { APIError } = require('../utils/apiError');

const ANALYSIS_TABLE = 'query_analyses';
const SUGGESTIONS_TABLE = 'optimization_suggestions';

async function analyzeQuery(userId, connectionId, query) {
  let pgClient;
  try {
    pgClient = await getCachedPgClient(connectionId);
    
    // Ensure query is safe to execute with EXPLAIN
    if (!query.trim().toLowerCase().startsWith('select') &&
        !query.trim().toLowerCase().startsWith('insert') &&
        !query.trim().toLowerCase().startsWith('update') &&
        !query.trim().toLowerCase().startsWith('delete')) {
      throw new APIError('Only SELECT, INSERT, UPDATE, DELETE queries can be analyzed.', 400);
    }

    // Execute EXPLAIN ANALYZE for detailed performance metrics
    const explainResult = await pgClient.query(`EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON) ${query}`);
    const explainJson = explainResult.rows[0]['QUERY PLAN'];
    
    const parsedAnalysis = parseExplainOutput(explainJson, query);

    const [savedAnalysis] = await knex(ANALYSIS_TABLE).insert({
      user_id: userId,
      connection_id: connectionId,
      query_text: query,
      total_time_ms: parsedAnalysis.totalTime,
      planning_time_ms: parsedAnalysis.planningTime,
      plan_json: JSON.stringify(parsedAnalysis.planJson),
    }).returning('*');

    // Save suggestions
    const suggestionRecords = parsedAnalysis.suggestions.map(s => ({
      analysis_id: savedAnalysis.id,
      type: s.type,
      level: s.level,
      message: s.message,
      details: JSON.stringify(s.details),
      status: 'pending',
    }));

    if (suggestionRecords.length > 0) {
      await knex(SUGGESTIONS_TABLE).insert(suggestionRecords);
    }

    return { ...parsedAnalysis, analysisId: savedAnalysis.id };

  } catch (error) {
    logger.error(`Error analyzing query for connection ${connectionId}: ${error.message}`);
    if (error instanceof APIError) {
      throw error;
    }
    // Attempt to extract a more user-friendly message for PostgreSQL errors
    const errorMessage = error.message.includes('PG') ? `Database Error: ${error.message.split('\n')[0]}` : error.message;
    throw new APIError(`Query analysis failed: ${errorMessage}`, 500);
  }
}

async function getAnalysisHistory(userId, connectionId) {
  try {
    const history = await knex(ANALYSIS_TABLE)
      .select('id', 'query_text', 'total_time_ms', 'planning_time_ms', 'created_at')
      .where({ user_id: userId, connection_id: connectionId })
      .orderBy('created_at', 'desc');
    return history;
  } catch (error) {
    logger.error(`Error fetching analysis history for user ${userId}, connection ${connectionId}: ${error.message}`);
    throw new APIError('Could not retrieve query analysis history', 500);
  }
}

async function getAnalysisDetails(analysisId) {
  try {
    const analysis = await knex(ANALYSIS_TABLE).select('*').where({ id: analysisId }).first();
    if (!analysis) {
      throw new APIError('Query analysis not found', 404);
    }
    const suggestions = await knex(SUGGESTIONS_TABLE).select('*').where({ analysis_id: analysisId });
    return { ...analysis, suggestions };
  } catch (error) {
    logger.error(`Error fetching analysis details for ID ${analysisId}: ${error.message}`);
    throw new APIError('Could not retrieve query analysis details', 500);
  }
}

async function updateSuggestionStatus(suggestionId, status) {
  try {
    const [updatedSuggestion] = await knex(SUGGESTIONS_TABLE)
      .where({ id: suggestionId })
      .update({ status, updated_at: knex.fn.now() })
      .returning('*');
    if (!updatedSuggestion) {
      throw new APIError('Suggestion not found', 404);
    }
    return updatedSuggestion;
  } catch (error) {
    logger.error(`Error updating suggestion ${suggestionId} status: ${error.message}`);
    throw new APIError('Could not update suggestion status', 500);
  }
}

module.exports = {
  analyzeQuery,
  getAnalysisHistory,
  getAnalysisDetails,
  updateSuggestionStatus,
};