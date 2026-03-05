const express = require('express');
const {
  createConnection,
  getConnections,
  getConnection,
  updateConnection,
  deleteConnection,
  testConnection,
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All connection routes require authentication

router.route('/')
  .post(createConnection)
  .get(getConnections);

router.route('/:id')
  .get(getConnection)
  .put(updateConnection)
  .delete(deleteConnection);

router.get('/:id/test', testConnection);

module.exports = router;