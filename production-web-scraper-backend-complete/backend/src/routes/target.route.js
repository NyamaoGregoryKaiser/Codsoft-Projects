const express = require('express');
const auth = require('../middlewares/auth.middleware');
const targetController = require('../controllers/target.controller');
const cacheMiddleware = require('../middlewares/cache.middleware');

const router = express.Router();

router
  .route('/')
  .post(auth('manageTargets'), targetController.createTarget)
  .get(auth('getTargets'), cacheMiddleware('targets'), targetController.getTargets); // Cached endpoint

router
  .route('/:targetId')
  .get(auth('getTargets'), targetController.getTarget)
  .patch(auth('manageTargets'), targetController.updateTarget)
  .delete(auth('manageTargets'), targetController.deleteTarget);

module.exports = router;