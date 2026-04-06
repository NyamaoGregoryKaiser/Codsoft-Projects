const Recommendation = require('../models/recommendation.model');
const logger = require('../config/logger');

class AnalyzerService {
    /**
     * Analyzes collected metrics and generates performance recommendations.
     * This is the core business logic for database optimization.
     * @param {number} dbConnectionId - The ID of the database connection being monitored.
     * @param {object} currentMetrics - The latest collected metrics.
     * @returns {Promise<Array<object>>} An array of new recommendations.
     */
    static async analyzeMetricsAndGenerateRecommendations(dbConnectionId, currentMetrics) {
        const recommendations = [];

        // Rule 1: Identify slow queries
        if (currentMetrics.slowQueries && currentMetrics.slowQueries.length > 0) {
            currentMetrics.slowQueries.forEach(query => {
                recommendations.push({
                    db_connection_id: dbConnectionId,
                    type: 'slow_query',
                    title: `Slow Query Detected: ${query.query.substring(0, 50)}...`,
                    description: `A query has been running for an unusually long time (${query.duration}). This indicates a potential bottleneck.`,
                    sql_suggestion: `Consider analyzing the query: \n${query.query}\nLook for missing indexes, complex joins, or inefficient WHERE clauses.`,
                    severity: 'critical',
                    details: {
                        pid: query.pid,
                        usename: query.usename,
                        query_start: query.query_start,
                        duration: query.duration,
                        full_query: query.query,
                    },
                });
            });
        }

        // Rule 2: Identify potentially unused indexes
        // This rule is simplistic; in a real scenario, you'd track idx_scan over time.
        // A single low scan count isn't enough to drop an index.
        if (currentMetrics.indexUsage && currentMetrics.indexUsage.length > 0) {
            currentMetrics.indexUsage.filter(idx => idx.index_scans < 10).forEach(idx => {
                recommendations.push({
                    db_connection_id: dbConnectionId,
                    type: 'index_unused',
                    title: `Potentially Unused Index: ${idx.index_name}`,
                    description: `Index "${idx.index_name}" on table "${idx.table_name}" has a very low scan count (${idx.index_scans}). It might be unused or rarely used, consuming disk space and impacting write performance.`,
                    sql_suggestion: `ANALYZE ${idx.table_name}; -- Re-evaluate after analysis\nDROP INDEX ${idx.index_name}; -- ONLY IF CONFIRMED UNUSED`,
                    severity: 'low',
                    details: idx,
                });
            });
        }

        // Rule 3: High number of idle connections
        if (currentMetrics.connections) {
            const idleConnections = currentMetrics.connections.find(c => c.state === 'idle')?.count || 0;
            if (idleConnections > 50) { // Threshold for "high" idle connections
                recommendations.push({
                    db_connection_id: dbConnectionId,
                    type: 'high_idle_connections',
                    title: `High Number of Idle Connections`,
                    description: `There are ${idleConnections} idle connections. A large number of idle connections can consume server resources.`,
                    sql_suggestion: `Review application connection pooling settings. Ensure connections are closed promptly after use.`,
                    severity: 'medium',
                    details: { idleConnectionsCount: idleConnections },
                });
            }
        }

        // Rule 4: Large tables with no/few indexes (requires more sophisticated schema analysis)
        // For this example, we'll just flag very large tables for review.
        if (currentMetrics.tableSizes && currentMetrics.tableSizes.length > 0) {
            currentMetrics.tableSizes.filter(table => table.size_bytes > (1024 * 1024 * 100)) // > 100MB
                .forEach(table => {
                    // This rule would ideally check actual indexes for the table,
                    // but for simplicity, we just flag large tables generally.
                    recommendations.push({
                        db_connection_id: dbConnectionId,
                        type: 'large_table_review',
                        title: `Large Table for Review: ${table.table_name}`,
                        description: `Table "${table.table_name}" is large (${table.size}). Consider reviewing its indexing strategy and usage patterns.`,
                        sql_suggestion: `SELECT * FROM pg_indexes WHERE tablename = '${table.table_name}'; -- Check existing indexes`,
                        severity: 'low',
                        details: table,
                    });
                });
        }

        // Filter out duplicate recommendations (e.g., same slow query, same unused index)
        // In a real system, you'd compare against *existing* pending recommendations
        // to avoid re-creating the exact same recommendation constantly.
        const existingRecommendations = await Recommendation.findByConnectionId(dbConnectionId, 'pending');
        const uniqueNewRecommendations = recommendations.filter(newRec =>
            !existingRecommendations.some(existingRec =>
                existingRec.type === newRec.type &&
                existingRec.title === newRec.title &&
                JSON.stringify(existingRec.details) === JSON.stringify(newRec.details)
            )
        );

        if (uniqueNewRecommendations.length > 0) {
            await Recommendation.createMany(uniqueNewRecommendations);
        }

        return uniqueNewRecommendations;
    }

    /**
     * Placeholder for advanced analysis (e.g., query plan analysis, missing FK detection).
     * This would involve more complex SQL queries against pg_catalog or pg_stat_statements.
     */
    static async advancedAnalysis(dbConnectionId, client) {
        // Example: Check for missing foreign key indexes
        // This is a complex query that varies by DB version and schema complexity
        // SELECT
        //     conrelid::regclass AS table_name,
        //     conname AS foreign_key_name,
        //     pg_get_constraintdef(c.oid) AS constraint_definition
        // FROM
        //     pg_constraint c
        // JOIN
        //     pg_class ON c.conrelid = pg_class.oid
        // WHERE
        //     contype = 'f'
        //     AND NOT EXISTS (
        //         SELECT 1
        //         FROM pg_index i
        //         WHERE i.indrelid = c.conrelid
        //           AND i.indkey @> c.conkey
        //     );
        // ... more complex analysis ...
        return [];
    }
}

module.exports = AnalyzerService;