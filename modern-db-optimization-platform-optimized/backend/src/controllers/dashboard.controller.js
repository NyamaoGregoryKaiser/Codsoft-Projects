const Metric = require('../models/metric.model');
const DbConnectionService = require('../services/dbConnection.service');
const { NotFoundError } = require('../utils/errorHandler');
const CacheService = require('../services/cache.service');
const logger = require('../config/logger');

class DashboardController {
    static async getDashboardSummary(req, res, next) {
        try {
            const userId = req.user.id;
            const cacheKey = `dashboardSummary:${userId}`;
            const cachedData = await CacheService.get(cacheKey);
            if (cachedData) {
                return res.status(200).json({ status: 'success', data: cachedData, source: 'cache' });
            }

            const connections = await DbConnectionService.getAllConnections(userId);
            const summary = {
                totalConnections: connections.length,
                activeMonitoring: connections.filter(c => c.is_monitoring_active).length,
                databases: []
            };

            for (const conn of connections) {
                const latestMetric = await Metric.findLatestByConnectionId(conn.id);
                const metricCount = await Metric.getMetricsCount(conn.id);

                summary.databases.push({
                    id: conn.id,
                    name: conn.name,
                    host: conn.host,
                    isMonitoringActive: conn.is_monitoring_active,
                    lastMonitored: latestMetric.length > 0 ? latestMetric[0].timestamp : null,
                    latestData: latestMetric.length > 0 ? latestMetric[0].data : null,
                    metricCount: metricCount,
                });
            }
            await CacheService.set(cacheKey, summary, 60); // Cache for 60 seconds
            res.status(200).json({ status: 'success', data: summary });
        } catch (error) {
            next(error);
        }
    }

    static async getConnectionMetrics(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params; // db_connection_id
            const { period = '24h' } = req.query; // e.g., '1h', '24h', '7d'

            // Verify connection exists and belongs to user
            const connection = await DbConnectionService.getConnectionById(id, userId);
            if (!connection) {
                throw new NotFoundError('Database connection not found or unauthorized access.');
            }

            const cacheKey = `connectionMetrics:${id}:${period}`;
            const cachedData = await CacheService.get(cacheKey);
            if (cachedData) {
                return res.status(200).json({ status: 'success', data: cachedData, source: 'cache' });
            }

            let startTime;
            switch (period) {
                case '1h': startTime = new Date(Date.now() - 60 * 60 * 1000); break;
                case '7d': startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
                case '24h':
                default: startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); break;
            }
            const endTime = new Date();

            const metrics = await Metric.findByConnectionIdAndTimeRange(id, startTime, endTime);

            // Process metrics for frontend visualization
            const processedMetrics = metrics.map(m => ({
                timestamp: m.timestamp,
                connections: m.data.connections,
                slowQueriesCount: m.data.slowQueries ? m.data.slowQueries.length : 0,
                databaseSize: m.data.databaseSize,
                // Add more processed metrics as needed
            }));

            await CacheService.set(cacheKey, processedMetrics, 30); // Cache for 30 seconds
            res.status(200).json({ status: 'success', data: processedMetrics });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DashboardController;