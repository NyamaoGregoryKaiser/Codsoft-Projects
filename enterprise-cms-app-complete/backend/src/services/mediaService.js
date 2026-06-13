const { Media } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs/promises'); // Use promises version for async/await
const { uploadPath } = require('../middleware/uploadMiddleware'); // Import upload path

/**
 * Upload and record media file.
 * @param {object} file - The file object from multer.
 * @param {string} uploadedByUserId - The ID of the user who uploaded the file.
 * @returns {object} - The created media record.
 * @throws {ApiError} 400 if file is missing.
 */
const uploadMedia = async (file, uploadedByUserId) => {
  if (!file) {
    throw new ApiError(400, 'No file uploaded.');
  }

  const media = await Media.create({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    filepath: `/uploads/${file.filename}`, // Relative URL path
    uploadedBy: uploadedByUserId,
  });

  logger.info(`Media uploaded: ${file.originalname} by ${uploadedByUserId}`);
  return media;
};

/**
 * Get all media files.
 * @param {object} queryOptions - Options for pagination, filtering.
 * @returns {object} - Paginated list of media files.
 */
const getAllMedia = async (queryOptions = {}) => {
  const { limit = 10, offset = 0 } = queryOptions;

  const mediaFiles = await Media.findAndCountAll({
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['createdAt', 'DESC']],
  });

  logger.info(`Fetched ${mediaFiles.rows.length} media files.`);
  return mediaFiles;
};

/**
 * Get a single media file by ID.
 * @param {string} mediaId - The ID of the media file.
 * @returns {object} - The media object.
 * @throws {ApiError} 404 if media not found.
 */
const getMediaById = async (mediaId) => {
  const media = await Media.findByPk(mediaId);

  if (!media) {
    throw new ApiError(404, 'Media file not found.');
  }
  logger.info(`Fetched media with ID: ${mediaId}`);
  return media;
};

/**
 * Delete a media file.
 * @param {string} mediaId - The ID of the media file to delete.
 * @returns {object} - Success message.
 * @throws {ApiError} 404 if media not found.
 * @throws {Error} if file deletion fails.
 */
const deleteMedia = async (mediaId) => {
  const media = await Media.findByPk(mediaId);

  if (!media) {
    throw new ApiError(404, 'Media file not found.');
  }

  // Delete the physical file from the server
  const fullFilePath = path.join(uploadPath, media.filename);
  try {
    await fs.unlink(fullFilePath);
    logger.info(`Physical file deleted: ${fullFilePath}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.warn(`Attempted to delete non-existent file: ${fullFilePath}. Deleting DB record anyway.`);
    } else {
      logger.error(`Failed to delete physical file: ${fullFilePath}`, err);
      throw new Error('Failed to delete physical file on server.');
    }
  }

  await media.destroy();
  logger.info(`Media record deleted from DB: ${media.originalname}`);
  return { message: 'Media file deleted successfully.' };
};

module.exports = {
  uploadMedia,
  getAllMedia,
  getMediaById,
  deleteMedia,
};