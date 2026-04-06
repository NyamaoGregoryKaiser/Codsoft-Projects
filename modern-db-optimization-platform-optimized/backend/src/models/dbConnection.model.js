const db = require('../db');

class DbConnection {
    static tableName = 'db_connections';

    static async create(connectionData) {
        const [connection] = await db(DbConnection.tableName).insert(connectionData).returning('*');
        return connection;
    }

    static async findById(id, userId) {
        let query = db(DbConnection.tableName).where({ id });
        if (userId) { // Ensure user can only access their own connections
            query = query.andWhere({ user_id: userId });
        }
        return query.first();
    }

    static async findAll(userId) {
        return db(DbConnection.tableName).where({ user_id: userId }).select('*');
    }

    static async update(id, userId, updates) {
        const [connection] = await db(DbConnection.tableName)
            .where({ id, user_id: userId })
            .update(updates)
            .returning('*');
        return connection;
    }

    static async delete(id, userId) {
        return db(DbConnection.tableName).where({ id, user_id: userId }).del();
    }

    static async findMonitoringActive() {
        return db(DbConnection.tableName).where({ is_monitoring_active: true }).select('*');
    }
}

module.exports = DbConnection;