const { Client } = require('pg');
const Metric = require('../models/metric.model');
const DbConnectionService = require('./dbConnection.service');
const AnalyzerService = require('./analyzer.service');
const logger = require('../config/logger');

class MonitoringService {
    /**
     * Establishes a connection to the target PostgreSQL database.
     * @param {object} connectionDetails - Database connection parameters.
     * @returns {Promise<Client>} A connected PostgreSQL client.
     */
    static async connectToTargetDb(connectionDetails) {
        const client = new Client({
            host: connectionDetails.host,
            port: connectionDetails.port,
            user: connectionDetails.username,
            password: connectionDetails.password, // Decrypted password
            database: connectionDetails.database,
            ssl: connectionDetails.ssl ? { rejectUnauthorized: false } : false, // Example for SSL
        });

        try {
            await client.connect();
            logger.info(`Successfully connected to target DB: ${connectionDetails.name}`);
            return client;
        } catch (error) {
            logger.error(`Failed to connect to target DB ${connectionDetails.name}:`, error.message);
            throw new Error(`Failed to connect to target database: ${error.message}`);
        }
    }

    /**
     * Fetches various PostgreSQL metrics.
     * This is a simplified example; a real system would have many more specific queries.
     * @param {Client} client - Connected PostgreSQL client.
     * @returns {Promise<object>} Collected metrics.
     */
    static async fetchPostgresMetrics(client) {
        let metrics = {};
        try {
            // 1. Connection Stats
            const connections = await client.query(`
                SELECT
                    state,
                    COUNT(*) AS count
                FROM pg_stat_activity
                GROUP BY state;
            `);
            metrics.connections = connections.rows;

            // 2. Slow Queries (example: queries running longer than 1 second)
            // Note: pg_stat_statements is usually needed for historical slow queries
            // This just shows currently running long queries
            const slowQueries = await client.query(`
                SELECT
                    pid,
                    usename,
                    application_name,
                    client_addr,
                    backend_start,
                    query_start,
                    state,
                    query,
                    AGE(NOW(), query_start) AS duration
                FROM pg_stat_activity
                WHERE state = 'active'
                  AND query NOT LIKE '%pg_stat_activity%'
                  AND AGE(NOW(), query_start) > INTERVAL '1 second'
                ORDER BY duration DESC;
            `);
            metrics.slowQueries = slowQueries.rows;

            // 3. Index Usage
            const indexUsage = await client.query(`
                SELECT
                    s.schemaname,
                    s.relname AS table_name,
                    s.indexrelname AS index_name,
                    s.idx_scan AS index_scans,
                    pg_relation_size(s.indexrelid) AS index_size_bytes
                FROM pg_stat_user_indexes s
                JOIN pg_index i ON s.indexrelid = i.indexrelid
                WHERE s.idx_scan < 10 AND NOT i.indisunique -- Example: potentially unused non-unique indexes
                ORDER BY s.idx_scan ASC;
            `);
            metrics.indexUsage = indexUsage.rows;

            // 4. Table Bloat (requires pgstattuple extension or similar complex queries)
            // Simplified example for table sizes
            const tableSizes = await client.query(`
                SELECT
                    relname AS table_name,
                    pg_size_pretty(pg_relation_size(oid)) AS size,
                    pg_relation_size(oid) AS size_bytes,
                    reltuples AS row_count
                FROM pg_class
                WHERE relkind = 'r' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')
                ORDER BY pg_relation_size(oid) DESC;
            `);
            metrics.tableSizes = tableSizes.rows;

            // 5. Database Size
            const dbSize = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;`);
            metrics.databaseSize = dbSize.rows[0].total_size;

            logger.info('Successfully fetched metrics from target DB.');
            return metrics;
        } catch (error) {
            logger.error('Error fetching PostgreSQL metrics:', error.message);
            throw new Error(`Failed to fetch metrics: ${error.message}`);
        } finally {
            await client.end();
        }
    }

    /**
     * Orchestrates the monitoring process for a single database connection.
     * @param {number} dbConnectionId - The ID of the database connection to monitor.
     */
    static async monitorDatabase(dbConnectionId) {
        logger.info(`Starting monitoring for DB Connection ID: ${dbConnectionId}`);
        let client = null;
        try {
            // Fetch connection details including decrypted password
            const connectionDetails = await DbConnectionService.getConnectionByIdWithPassword(dbConnectionId, null); // null for userId as this is a background job
            if (!connectionDetails) {
                logger.warn(`Monitoring skipped: DB Connection ID ${dbConnectionId} not found.`);
                return;
            }

            // Connect to the target database
            client = await MonitoringService.connectToTargetDb(connectionDetails);

            // Fetch metrics
            const metrics = await MonitoringService.fetchPostgresMetrics(client);

            // Store metrics in the system's database
            await Metric.create({
                db_connection_id: dbConnectionId,
                data: metrics,
                timestamp: new Date(),
            });
            logger.info(`Metrics stored for DB Connection ID: ${dbConnectionId}`);

            // Analyze metrics and generate recommendations
            const newRecommendations = await AnalyzerService.analyzeMetricsAndGenerateRecommendations(dbConnectionId, metrics);
            if (newRecommendations.length > 0) {
                logger.info(`Generated ${newRecommendations.length} new recommendations for DB Connection ID: ${dbConnectionId}`);
            }

        } catch (error) {
            logger.error(`Error during monitoring for DB Connection ID ${dbConnectionId}:`, error.message);
        } finally {
            if (client && client._connected) { // Check if client is still connected to ensure .end() doesn't error
                await client.end().catch(e => logger.error(`Error closing client for DB Connection ID ${dbConnectionId}:`, e.message));
            }
        }
    }
}

module.exports = MonitoringService;