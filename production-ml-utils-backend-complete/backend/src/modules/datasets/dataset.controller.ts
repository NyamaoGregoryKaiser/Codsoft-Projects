```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/appError';
import { uploadSingleFile } from '../../utils/fileUpload';
import { DatasetService } from './dataset.service';
import { config } from '../../config';
import * as yup from 'yup';
import fs from 'fs';
import path from 'path';

const datasetService = new DatasetService();

const createDatasetSchema = yup.object().shape({
  name: yup.string().min(3).max(255).required(),
  description: yup.string().max(1000).optional(),
  projectId: yup.string().uuid().required(),
});

export const createDataset = async (req: Request, res: Response, next: NextFunction) => {
  uploadSingleFile(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File too large! Max size is 50MB', 413));
      }
      return next(new AppError(err.message, err.statusCode || 500));
    }

    if (!req.file) {
      return next(new AppError('No file uploaded!', 400));
    }

    try {
      const { name, description, projectId } = await createDatasetSchema.validate(req.body, { abortEarly: false });

      const dataset = await datasetService.createDataset({
        name,
        description,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        projectId,
        owner: req.user!,
      });

      res.status(201).json({
        status: 'success',
        data: { dataset },
      });
    } catch (error: any) {
      // If validation or DB save fails after file upload, delete the uploaded file
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
      if (error instanceof yup.ValidationError) {
        return next(new AppError(error.errors.join(', '), 400));
      }
      next(error);
    }
  });
};

export const getDataset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dataset = await datasetService.getDatasetById(req.params.id);
    if (!dataset || (dataset.owner.id !== req.user?.id && req.user?.role !== 'admin')) {
      return next(new AppError('Dataset not found or you do not have access', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { dataset },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllDatasets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string;
    const ownerId = req.user?.role === 'admin' ? undefined : req.user?.id;

    const datasets = await datasetService.getAllDatasets(ownerId, projectId);
    res.status(200).json({
      status: 'success',
      results: datasets.length,
      data: { datasets },
    });
  } catch (error: any) {
    next(error);
  }
};

export const downloadDataset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dataset = await datasetService.getDatasetById(req.params.id);
    if (!dataset || (dataset.owner.id !== req.user?.id && req.user?.role !== 'admin')) {
      return next(new AppError('Dataset not found or you do not have access', 404));
    }

    const filePath = path.join(config.storagePath, path.basename(dataset.filePath));
    if (!fs.existsSync(filePath)) {
      return next(new AppError('File not found on server', 404));
    }

    res.download(filePath, dataset.name, (err) => {
      if (err) {
        return next(new AppError('Error downloading file: ' + err.message, 500));
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteDataset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dataset = await datasetService.getDatasetById(req.params.id);
    if (!dataset || (dataset.owner.id !== req.user?.id && req.user?.role !== 'admin')) {
      return next(new AppError('Dataset not found or you do not have access', 404));
    }

    // Delete file from disk
    const filePath = path.join(config.storagePath, path.basename(dataset.filePath));
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting dataset file from disk:', err);
      });
    }

    await datasetService.deleteDataset(req.params.id, req.user!.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};
```