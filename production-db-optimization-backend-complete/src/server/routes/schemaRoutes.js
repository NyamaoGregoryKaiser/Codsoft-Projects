const express = require('express');
const {
  getTables,
  getTableDetails,
} = require('../controllers/schemaController');
const { protect } = require('../middleware/authMiddleware');

const router = express = require('express');

const router = express.Router();

router.use(protect); // All schema routes require authentication

router.get('/:connectionId/tables', getTables);
router.get('/:connectionId/tables/:schemaName/:tableName', getTableDetails);

module.exports = router;