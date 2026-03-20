const express = require('express');
const router = express.Router();
const { getSlowQueries, getQueryById, getQueryExplanations } = require('@controllers/queryController');
const { protect, authorize } = require('@middleware/authMiddleware');

// Base route to get all slow queries for an instance
router.get('/:dbInstanceId', protect, getSlowQueries);

// Route to get a specific query by ID (including basic details + embedded explanations)
router.get('/:dbInstanceId/:queryId', protect, getQueryById);

// Route to explicitly get query explanations for a specific query
router.get('/:dbInstanceId/:queryId/explanations', protect, getQueryExplanations);

module.exports = router;