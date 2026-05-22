```typescript
import multer from 'multer';
import { AppError } from './appError';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

// Ensure the storage path exists
if (!fs.existsSync(config.storagePath)) {
  fs.mkdirSync(config.storagePath, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // You can customize destination based on file type or user
    // For simplicity, all uploads go to a single 'uploads' directory
    cb(null, config.storagePath);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const originalName = file.originalname.split('.')[0];
    cb(null, `${originalName}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req: any, file: any, cb: any) => {
  // Example: Only allow common ML data/model formats
  const allowedMimeTypes = [
    'text/csv',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/octet-stream', // Generic binary, often used for .pkl, .bin, .pth
    'application/zip', // For zipped models/datasets
    'application/x-python-bytecode', // .pyc
    'application/x-tar', // .tar
    'application/gzip', // .gz
    // Add specific model formats if known, e.g., for TensorFlow/Keras (.h5, .pb)
    // For a real system, you might inspect file headers for deeper validation
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Not a supported file type! Please upload a valid data or model file.', 400), false);
  }
};

export const uploadSingleFile = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}).single('file'); // 'file' is the name of the input field in the form
```