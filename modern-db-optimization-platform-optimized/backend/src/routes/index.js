const express = require('express');
const authRoutes = require('./auth.routes');
const dbConnectionRoutes = require('./dbConnection.routes');
const dashboardRoutes = require('./dashboard.routes');
const recommendationRoutes = require('./recommendation.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/databases', dbConnectionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/databases/:dbConnectionId/recommendations', recommendationRoutes); // Nested route

module.exports = router;