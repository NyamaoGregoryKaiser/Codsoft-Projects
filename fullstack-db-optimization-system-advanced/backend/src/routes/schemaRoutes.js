const express = require('express');
const router = express.Router();
const { getSchemaIssues, updateSchemaIssueStatus } = require('@controllers/schemaController');
const { protect, authorize } = require('@middleware/authMiddleware');

router.get('/:dbInstanceId', protect, getSchemaIssues);
router.put('/:dbInstanceId/:issueId/status', protect, authorize(['admin']), updateSchemaIssueStatus);

module.exports = router;