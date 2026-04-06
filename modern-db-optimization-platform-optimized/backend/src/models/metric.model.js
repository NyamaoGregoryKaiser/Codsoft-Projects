const db = require('../db');

class Metric {
    static tableName = 'metrics';

    static async create(metricData) {
        const [metric] = await db(Metric.tableName).insert(metricData).returning('*');
        return metric;
    }

    static async findLatestByConnectionId(dbConnectionId, limit = 1) {
        return db(Metric.tableName)
            .where({ db_connection_id: dbConnectionId })
            .orderBy('timestamp', 'desc')
            .limit(limit);
    }

    static async findByConnectionIdAndTimeRange(dbConnectionId, startTime, endTime) {
        return db(Metric.tableName)
            .where({ db_connection_id: dbConnectionId })
            .andWhere('timestamp', '>=', startTime)
            .andWhere('timestamp', '<=', endTime)
            .orderBy('timestamp', 'asc');
    }

    static async getMetricsCount(dbConnectionId) {
        const result = await db(Metric.tableName)
            .where({ db_connection_id: dbConnectionId })
            .count('id as count')
            .first();
        return parseInt(result.count, 10);
    }
}

module.exports = Metric;