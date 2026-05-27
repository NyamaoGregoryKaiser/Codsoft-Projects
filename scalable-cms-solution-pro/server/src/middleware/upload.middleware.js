```javascript
const multer = require('multer');
const path = require('path');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

// Define storage for files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/misc'; // Default destination
    if (file.fieldname === 'featuredImage') {
      dest = 'uploads/posts';
    } else if (file.fieldname === 'files') {
      dest = 'uploads/media';
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter to allow only specific image types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(httpStatus.BAD_REQUEST, 'Invalid file type. Only images (JPG, PNG, GIF, WEBP), PDFs, and MP4 videos are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;
```