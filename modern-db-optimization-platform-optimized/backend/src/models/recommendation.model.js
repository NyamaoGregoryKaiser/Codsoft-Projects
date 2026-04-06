const db = require('../db');

class Recommendation {
    static tableName = 'recommendations';

    static async create(recommendationData) {
        const [rec] = await db(Recommendation.tableName).insert(recommendationData).returning('*');
        return rec;
    }

    static async createMany(recommendationDataArray) {
        if (!recommendationDataArray || recommendationDataArray.length === 0) {
            return [];
        }
        return db(Recommendation.tableName).insert(recommendationDataArray).returning('*');
    }

    static async findByConnectionId(dbConnectionId, status = 'pending') {
        let query = db(Recommendation.tableName)
            .where({ db_connection_id: dbConnectionId })
            .orderBy('generated_at', 'desc');

        if (status && status !== 'all') {
            query = query.andWhere({ status });
        }

        return query;
    }

    static async updateStatus(id, dbConnectionId, status, userId) {
        // Ensure user owns the connection for this recommendation
        const connectionExists = await db('db_connections').where({ id: dbConnectionId, user_id: userId }).first();
        if (!connectionExists) {
            return null; // Or throw an error
        }

        const updates = { status };
        if (status === 'implemented' || status === 'dismissed') {
            updates.resolved_at = db.fn.now();
        } else {
            updates.resolved_at = null;
        }

        const [rec] = await db(Recommendation.tableName)
            .where({ id, db_connection_id: dbConnectionId })
            .update(updates)
            .returning('*');
        return rec;
    }
}

module.exports = Recommendation;