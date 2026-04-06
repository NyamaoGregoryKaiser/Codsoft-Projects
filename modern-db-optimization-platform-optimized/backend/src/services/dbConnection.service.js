const DbConnection = require('../models/dbConnection.model');
const { encrypt, decrypt } = require('../utils/encryption'); // Assuming you have an encryption utility
const { NotFoundError, ConflictError } = require('../utils/errorHandler');
const { monitoringQueue } = require('../jobs/queue');
const logger = require('../config/logger');

class DbConnectionService {
    static async createConnection(userId, connectionData) {
        const { name, host, port, username, password, database } = connectionData;

        // Check for existing connection with same name for this user
        const existingConnection = await DbConnection.findAll(userId);
        if (existingConnection.some(conn => conn.name === name)) {
            throw new ConflictError(`Connection with name '${name}' already exists for this user.`);
        }

        // Encrypt the password before storing
        const encryptedPassword = encrypt(password);

        const newConnection = await DbConnection.create({
            user_id: userId,
            name,
            host,
            port,
            username,
            password: encryptedPassword,
            database,
        });

        logger.info(`User ${userId} created new DB connection: ${name}`);
        // Return without sensitive password
        const { password: _, ...connectionWithoutPassword } = newConnection;
        return connectionWithoutPassword;
    }

    static async getAllConnections(userId) {
        const connections = await DbConnection.findAll(userId);
        // Decrypt passwords if needed for display, or omit them
        return connections.map(conn => {
            const { password: _, ...connWithoutPassword } = conn;
            return connWithoutPassword;
        });
    }

    static async getConnectionById(connectionId, userId) {
        const connection = await DbConnection.findById(connectionId, userId);
        if (!connection) {
            throw new NotFoundError('Database connection not found or unauthorized access.');
        }
        // Decrypt password if needed for external use, or just return without it
        const { password: _, ...connectionWithoutPassword } = connection;
        return connectionWithoutPassword;
    }

    static async getConnectionByIdWithPassword(connectionId, userId) {
        const connection = await DbConnection.findById(connectionId, userId);
        if (!connection) {
            throw new NotFoundError('Database connection not found or unauthorized access.');
        }
        connection.password = decrypt(connection.password);
        return connection;
    }

    static async updateConnection(connectionId, userId, updateData) {
        const existingConnection = await DbConnection.findById(connectionId, userId);
        if (!existingConnection) {
            throw new NotFoundError('Database connection not found or unauthorized access.');
        }

        // Encrypt password if it's being updated
        if (updateData.password) {
            updateData.password = encrypt(updateData.password);
        }

        const updatedConnection = await DbConnection.update(connectionId, userId, updateData);
        if (!updatedConnection) {
            throw new NotFoundError('Database connection not found or unauthorized access after update attempt.');
        }

        logger.info(`User ${userId} updated DB connection: ${updatedConnection.name} (ID: ${connectionId})`);
        const { password: _, ...connectionWithoutPassword } = updatedConnection;
        return connectionWithoutPassword;
    }

    static async deleteConnection(connectionId, userId) {
        const deletedCount = await DbConnection.delete(connectionId, userId);
        if (deletedCount === 0) {
            throw new NotFoundError('Database connection not found or unauthorized access.');
        }
        logger.info(`User ${userId} deleted DB connection ID: ${connectionId}`);
        return { message: 'Connection deleted successfully.' };
    }

    static async toggleMonitoring(connectionId, userId, activate) {
        const connection = await DbConnection.findById(connectionId, userId);
        if (!connection) {
            throw new NotFoundError('Database connection not found or unauthorized access.');
        }

        if (connection.is_monitoring_active === activate) {
            return { message: `Monitoring already ${activate ? 'active' : 'inactive'}.` };
        }

        const updatedConnection = await DbConnection.update(connectionId, userId, { is_monitoring_active: activate });

        if (activate) {
            // Add to job queue
            const jobName = `monitorDb-${connectionId}`;
            await monitoringQueue.add(jobName, { dbConnectionId: connectionId }, {
                repeat: {
                    every: config.monitoring.intervalMs,
                    key: jobName
                },
                jobId: jobName // Ensure unique job ID for repeatable jobs
            });
            logger.info(`Monitoring started for DB Connection ID: ${connectionId}`);
        } else {
            // Remove from job queue
            const jobName = `monitorDb-${connectionId}`;
            await monitoringQueue.removeRepeatable(jobName, {
                every: config.monitoring.intervalMs,
                key: jobName
            });
            logger.info(`Monitoring stopped for DB Connection ID: ${connectionId}`);
        }

        const { password: _, ...connWithoutPassword } = updatedConnection;
        return {
            ...connWithoutPassword,
            message: `Monitoring ${activate ? 'started' : 'stopped'} successfully.`
        };
    }
}

module.exports = DbConnectionService;