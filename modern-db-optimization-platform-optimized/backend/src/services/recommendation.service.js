const Recommendation = require('../models/recommendation.model');
const { NotFoundError } = require('../utils/errorHandler');
const logger = require('../config/logger');

class RecommendationService {
    static async getRecommendationsForConnection(dbConnectionId, userId, status = 'pending') {
        // In a real app, you'd verify dbConnectionId belongs to userId.
        // For now, `Recommendation.findByConnectionId` is assumed to be authorized.
        const recommendations = await Recommendation.findByConnectionId(dbConnectionId, status);
        return recommendations;
    }

    static async updateRecommendationStatus(recommendationId, dbConnectionId, newStatus, userId) {
        // Validate newStatus
        const validStatuses = ['pending', 'implemented', 'dismissed'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error('Invalid recommendation status provided.');
        }

        const updatedRecommendation = await Recommendation.updateStatus(
            recommendationId,
            dbConnectionId,
            newStatus,
            userId
        );

        if (!updatedRecommendation) {
            throw new NotFoundError('Recommendation not found or unauthorized access.');
        }

        logger.info(`User ${userId} updated recommendation ${recommendationId} to status: ${newStatus}`);
        return updatedRecommendation;
    }
}

module.exports = RecommendationService;