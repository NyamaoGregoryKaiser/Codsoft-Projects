const DbConnectionService = require('../services/dbConnection.service');
const { validationSchema } = require('../utils/validation');

class DbConnectionController {
    static async createConnection(req, res, next) {
        try {
            await validationSchema.createDbConnection.validateAsync(req.body);
            const userId = req.user.id;
            const connection = await DbConnectionService.createConnection(userId, req.body);
            res.status(201).json({ status: 'success', data: connection });
        } catch (error) {
            next(error);
        }
    }

    static async getAllConnections(req, res, next) {
        try {
            const userId = req.user.id;
            const connections = await DbConnectionService.getAllConnections(userId);
            res.status(200).json({ status: 'success', data: connections });
        } catch (error) {
            next(error);
        }
    }

    static async getConnectionById(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const connection = await DbConnectionService.getConnectionById(id, userId);
            res.status(200).json({ status: 'success', data: connection });
        } catch (error) {
            next(error);
        }
    }

    static async updateConnection(req, res, next) {
        try {
            await validationSchema.updateDbConnection.validateAsync(req.body);
            const userId = req.user.id;
            const { id } = req.params;
            const updatedConnection = await DbConnectionService.updateConnection(id, userId, req.body);
            res.status(200).json({ status: 'success', data: updatedConnection });
        } catch (error) {
            next(error);
        }
    }

    static async deleteConnection(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const result = await DbConnectionService.deleteConnection(id, userId);
            res.status(200).json({ status: 'success', message: result.message });
        } catch (error) {
            next(error);
        }
    }

    static async startMonitoring(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const result = await DbConnectionService.toggleMonitoring(id, userId, true);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    static async stopMonitoring(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const result = await DbConnectionService.toggleMonitoring(id, userId, false);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DbConnectionController;