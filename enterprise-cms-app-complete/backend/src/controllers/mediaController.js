const mediaService = require('../services/mediaService');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Upload a single media file.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file provided for upload.');
    }
    const media = await mediaService.uploadMedia(req.file, req.user.id);
    res.status(201).json({
      status: 'success',
      message: 'Media uploaded successfully',
      data: media,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all media files.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getAllMedia = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const mediaFiles = await mediaService.getAllMedia({ limit, offset });
    res.status(200).json({
      status: 'success',
      data: mediaFiles.rows,
      meta: {
        total: mediaFiles.count,
        limit: parseInt(limit, 10) || 10,
        offset: parseInt(offset, 10) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a media file by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getMediaById = async (req, res, next) => {
  try {
    const media = await mediaService.getMediaById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: media,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a media file by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const deleteMedia = async (req, res, next) => {
  try {
    const result = await mediaService.deleteMedia(req.params.id);
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia,
  getAllMedia,
  getMediaById,
  deleteMedia,
};