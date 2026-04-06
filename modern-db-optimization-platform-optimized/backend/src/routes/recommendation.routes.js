const express = require('express');
const RecommendationController = require('../controllers/recommendation.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Get recommendations for a specific database connection
router.get('/:dbConnectionId', RecommendationController.getRecommendations);

// Update status of a specific recommendation
router.put('/:dbConnectionId/recommendations/:id', RecommendationController.updateRecommendationStatus);

module.exports = router;