const express = require('express');
const mediaController = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadSingleFile } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Only authenticated users with 'editor' or 'admin' role can upload/manage media
router.post(
  '/upload',
  authenticate,
  authorize(['admin', 'editor', 'author']), // Authors also need to upload images for their posts
  uploadSingleFile('media'), // 'media' is the field name for the file in the form data
  mediaController.uploadMedia
);
router.get('/', authenticate, authorize(['admin', 'editor', 'author']), mediaController.getAllMedia); // Any authorized user can view media
router.get('/:id', authenticate, authorize(['admin', 'editor', 'author']), mediaController.getMediaById);
router.delete('/:id', authenticate, authorize(['admin', 'editor']), mediaController.deleteMedia); // Only admin/editor can delete media

module.exports = router;