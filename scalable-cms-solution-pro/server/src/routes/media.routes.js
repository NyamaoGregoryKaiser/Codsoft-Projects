```javascript
const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // Multer middleware

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media file management
 */

/**
 * @swagger
 * /media:
 *   get:
 *     summary: Retrieve a list of media files
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of media files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Media'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', protect, authorize(['admin', 'editor', 'author']), mediaController.getAllMedia);

/**
 * @swagger
 * /media:
 *   post:
 *     summary: Upload new media file(s)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of files to upload
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Media'
 *       400:
 *         description: Bad request (no files, unsupported file type, etc.)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  protect,
  authorize(['admin', 'editor', 'author']),
  upload.array('files', 10), // Allow up to 10 files
  mediaController.uploadMedia
);

/**
 * @swagger
 * /media/{id}:
 *   delete:
 *     summary: Delete a media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the media file to delete
 *     responses:
 *       204:
 *         description: Media file deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Media file not found
 */
router.delete('/:id', protect, authorize(['admin', 'editor', 'author']), mediaController.deleteMedia);

module.exports = router;
```