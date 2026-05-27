```javascript
const httpStatus = require('http-status');
const { Media } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

exports.getAllMedia = async (req, res, next) => {
  try {
    const mediaFiles = await Media.findAll();
    res.status(httpStatus.OK).json(mediaFiles);
  } catch (error) {
    next(error);
  }
};

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No files uploaded');
    }

    const uploadedMedia = [];
    for (const file of req.files) {
      const media = await Media.create({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `/uploads/media/${file.filename}`, // Relative path for access
        uploadedBy: req.user.id,
      });
      uploadedMedia.push(media);
    }
    logger.info(`${req.files.length} media files uploaded by ${req.user.id}`);
    res.status(httpStatus.CREATED).json(uploadedMedia);
  } catch (error) {
    // If files were uploaded but DB entry failed, delete the files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(err => logger.error(`Failed to delete uploaded file: ${file.path}, error: ${err.message}`));
      }
    }
    next(error);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Media file not found');
    }

    // Optional: Authorization - Only admin/editor or the original uploader can delete
    if (req.user.role === 'author' && media.uploadedBy !== req.user.id && !['admin', 'editor'].includes(req.user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this media file.');
    }

    // Delete the file from the filesystem
    const fullPath = path.join(__dirname, '../../uploads', media.path.replace('/uploads/', ''));
    try {
      await fs.unlink(fullPath);
      logger.info(`Deleted media file from disk: ${fullPath}`);
    } catch (err) {
      logger.warn(`Failed to delete media file from disk: ${fullPath}, error: ${err.message}`);
      // Continue with DB deletion even if file delete fails (e.g., file already gone)
    }

    await media.destroy();
    logger.info(`Media file ${req.params.id} deleted by ${req.user.id}`);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
```