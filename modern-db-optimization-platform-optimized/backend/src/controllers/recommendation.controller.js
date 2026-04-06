const RecommendationService = require('../services/recommendation.service');
const { validationSchema } = require('../utils/validation');

class RecommendationController {
    static async getRecommendations(req, res, next) {
        try {
            const userId = req.user.id;
            const { dbConnectionId } = req.params;
            const { status } = req.query; // Optional: 'pending', 'implemented', 'dismissed', 'all'

            const recommendations = await RecommendationService.getRecommendationsForConnection(dbConnectionId, userId, status);
            res.status(200).json({ status: 'success', data: recommendations });
        } catch (error) {
            next(error);
        }
    }

    static async updateRecommendationStatus(req, res, next) {
        try {
            await validationSchema.updateRecommendationStatus.validateAsync(req.body);
            const userId = req.user.id;
            const { dbConnectionId, id } = req.params; // recommendationId
            const { status: newStatus } = req.body;

            const updatedRecommendation = await RecommendationService.updateRecommendationStatus(
                id,
                dbConnectionId,
                newStatus,
                userId
            );
            res.status(200).json({ status: 'success', data: updatedRecommendation });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = RecommendationController;