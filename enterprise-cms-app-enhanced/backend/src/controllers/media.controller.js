const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const db = require('../models');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

const uploadMedia = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
  }

  const media = await db.Media.create({
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    filePath: path.relative(path.join(__dirname, '../../', config.uploadPath), req.file.path), // Store relative path
    userId: req.user.id,
  });

  res.status(httpStatus.CREATED).send(media);
});

const getMediaItems = catchAsync(async (req, res) => {
  const mediaItems = await db.Media.findAll({
    include: [{ model: db.User, as: 'uploader', attributes: ['id', 'name'] }]
  });
  res.send(mediaItems);
});

const getMediaItem = catchAsync(async (req, res) => {
  const media = await db.Media.findByPk(req.params.mediaId, {
    include: [{ model: db.User, as: 'uploader', attributes: ['id', 'name'] }]
  });
  if (!media) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Media item not found');
  }
  res.send(media);
});

const deleteMediaItem = catchAsync(async (req, res) => {
  const media = await db.Media.findByPk(req.params.mediaId);
  if (!media) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Media item not found');
  }

  // Check if user is uploader or admin
  if (media.userId !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: You do not own this media item and lack permission to delete');
  }

  const fullPath = path.join(config.uploadPath, media.filePath.replace(`${config.frontendUrl}/uploads/`, '')); // Reconstruct local path

  // Delete file from filesystem
  fs.unlink(fullPath, (err) => {
    if (err) {
      // Log error but don't stop execution, DB record is primary
      console.error(`Failed to delete file from disk: ${fullPath}`, err);
    }
  });

  await media.destroy();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  uploadMedia,
  getMediaItems,
  getMediaItem,
  deleteMediaItem,
};