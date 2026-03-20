const express = require('express');
const router = express.Router();
const { getIndexSuggestions, updateIndexSuggestionStatus } = require('@controllers/indexController');
const { protect, authorize } = require('@middleware/authMiddleware');

router.get('/:dbInstanceId', protect, getIndexSuggestions);
router.put('/:dbInstanceId/:suggestionId/status', protect, authorize(['admin']), updateIndexSuggestionStatus);

module.exports = router;