const express = require('express');
const {
  analyzeQuery,
  getAnalysisHistory,
  getAnalysisDetails,
  updateSuggestion,
} = require('../controllers/queryAnalysisController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All query analysis routes require authentication

router.post('/analyze', analyzeQuery);
router.get('/history/:connectionId', getAnalysisHistory);
router.get('/:analysisId', getAnalysisDetails);
router.put('/suggestions/:suggestionId', updateSuggestion);

module.exports = router;