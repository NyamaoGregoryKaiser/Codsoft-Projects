const express = require('express');
const auth = require('../middlewares/auth.middleware');
const upload = require('../utils/multer');
const mediaController = require('../controllers/media.controller');
const { cacheMiddleware, clearCache } = require('../middlewares/cache.middleware');

const router = express.Router();

router.post(
  '/upload',
  auth('admin', 'editor', 'user'), // Any logged-in user can upload
  upload.single('file'),
  clearCache,
  mediaController.uploadMedia
);

router
  .route('/')
  .get(cacheMiddleware, mediaController.getMediaItems); // Potentially public, or restricted by auth

router
  .route('/:mediaId')
  .get(cacheMiddleware, mediaController.getMediaItem) // Potentially public, or restricted
  .delete(auth('admin', 'editor', 'user'), clearCache, mediaController.deleteMediaItem); // Only uploader or admin can delete

module.exports = router;