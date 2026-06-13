const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { ApiError } = require('./errorHandler');
const logger = require('../utils/logger');

const uploadPath = path.join(__dirname, '../../', config.upload.path);

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  logger.info(`Upload directory created at: ${uploadPath}`);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer file filter to allow specific mime types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, PDF, MP4 are allowed.'), false);
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB default
  },
  fileFilter: fileFilter,
});

/**
 * Middleware to handle single file upload.
 * Wraps multer's single method to catch errors gracefully.
 * @param {string} fieldName - The name of the form field for the file.
 * @returns {function} Express middleware
 */
const uploadSingleFile = (fieldName) => (req, res, next) => {
  const singleUpload = upload.single(fieldName);
  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `File too large. Max size is ${config.upload.maxFileSize / (1024 * 1024)}MB.`));
      }
      return next(new ApiError(400, `Multer error: ${err.message}`));
    } else if (err) {
      // Custom fileFilter errors or other unexpected errors
      return next(err);
    }
    next();
  });
};

module.exports = {
  uploadSingleFile,
  uploadPath, // Exported for use in media service
};