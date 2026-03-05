const knex = require('../db/knex');
const { getCachedPgClient } = require('./connectionService');
const logger = require('../utils/logger');
const { APIError } = require('../utils/apiError');

const METRICS_TABLE = 'metrics_history';

/**
 * Fetches common PostgreSQL metrics.
 * NOTE: For a real production system, this would be much more extensive,
 * using tools like pg_stat_statements, pg_stat_activity, pg_stat_user_tables, etc.
 * This is a simplified example.
 * @param {pg.Client} pgClient The PostgreSQL client for the target database.
 * @returns {Object} An object containing various metrics.
 */
async function fetchDatabaseMetrics(pgClient) {
  try {
    // Active connections
    const activeConnectionsRes = await pgClient.query('SELECT count(*) FROM pg_stat_activity WHERE state = \'active\';');
    const totalConnectionsRes = await pgClient.query('SELECT count(*) FROM pg_stat_activity;');

    // Disk usage (example: for a specific table, or total database size)
    const dbSizeRes = await pgClient.query('SELECT pg_database_size(current_database());');

    // Cache hit ratio (simplified example, usually from pg_stat_database)
    // This requires specific pg_stat_database access which might not be granted easily.
    // For simplicity, we'll simulate. A real implementation would query pg_stat_database
    // SELECT blks_hit * 100 / (blks_hit + blks_read) AS hit_ratio FROM pg_stat_database WHERE datname = current_database();
    const cacheHitRatio = Math.floor(Math.random() * (99 - 80 + 1)) + 80; // Simulate 80-99%

    // Number of slow queries (would typically be from pg_stat_statements or custom log parsing)
    // Simulating as this requires more setup
    const slowQueries = Math.floor(Math.random() * 5); // Simulate 0-4 slow queries

    return {
      active_connections: parseInt(activeConnectionsRes.rows[0].count),
      total_connections: parseInt(totalConnectionsRes.rows[0].count),
      database_size_bytes: parseInt(dbSizeRes.rows[0].pg_database_size),
      cache_hit_ratio_percent: cacheHitRatio,
      slow_queries_count: slowQueries,
      // Add more metrics here based on actual pg_stat_* views
    };
  } catch (error) {
    logger.error(`Error fetching metrics from target DB: ${error.message}`);
    // Check for permission errors, specifically
    if (error.code === '42501') { // insufficient_privilege
      throw new APIError('Insufficient privileges to collect all metrics. Ensure the database user has MONITORing roles.', 403);
    }
    throw new APIError(`Failed to fetch database metrics: ${error.message}`, 500);
  }
}

async function recordMetrics(userId, connectionId) {
  let pgClient;
  try {
    pgClient = await getCachedPgClient(connectionId);
    const metrics = await fetchDatabaseMetrics(pgClient);

    const [savedMetric] = await knex(METRICS_TABLE).insert({
      user_id: userId,
      connection_id: connectionId,
      ...metrics,
    }).returning('*');
    logger.info(`Recorded metrics for connection ${connectionId}: ${JSON.stringify(metrics)}`);
    return savedMetric;
  } catch (error) {
    logger.error(`Error recording metrics for connection ${connectionId}: ${error.message}`);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to record metrics', 500);
  }
}

async function getMetricsHistory(userId, connectionId, timeRange = '24h') {
  try {
    let interval;
    switch (timeRange) {
      case '1h': interval = '1 hour'; break;
      case '24h': interval = '24 hours'; break;
      case '7d': interval = '7 days'; break;
      case '30d': interval = '30 days'; break;
      default: interval = '24 hours';
    }

    const history = await knex(METRICS_TABLE)
      .select('*')
      .where({ user_id: userId, connection_id: connectionId })
      .where('created_at', '>=', knex.raw(`NOW() - INTERVAL '${interval}'`))
      .orderBy('created_at', 'asc');

    return history;
  } catch (error) {
    logger.error(`Error fetching metrics history for user ${userId}, connection ${connectionId}: ${error.message}`);
    throw new APIError('Could not retrieve metrics history', 500);
  }
}

module.exports = {
  fetchDatabaseMetrics,
  recordMetrics,
  getMetricsHistory,
};