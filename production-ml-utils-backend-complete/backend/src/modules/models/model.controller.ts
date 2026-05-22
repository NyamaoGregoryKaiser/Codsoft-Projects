```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/appError';
import { uploadSingleFile } from '../../utils/fileUpload';
import { ModelService } from './model.service';
import * as yup from 'yup';
import fs from 'fs';
import path from 'path';
import { config } from '../../config';

const modelService = new ModelService();

const createModelSchema = yup.object().shape({
  name: yup.string().min(3).max(255).required(),
  description: yup.string().max(1000).optional(),
  version: yup.string().matches(/^\d+\.\d+\.\d+$/, 'Version must be in X.Y.Z format').required(),
  projectId: yup.string().uuid().required(),
});

export const createModel = async (req: Request, res: Response, next: NextFunction) => {
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
      const { name, description, version, projectId } = await createModelSchema.validate(req.body, { abortEarly: false });

      const model = await modelService.createModel({
        name,
        description,
        version,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        projectId,
        owner: req.user!,
      });

      res.status(201).json({
        status: 'success',
        data: { model },
      });
    } catch (error: any) {
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

export const getModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await modelService.getModelById(req.params.id);
    if (!model || (model.owner.id !== req.user?.id && req.user?.role !== 'admin')) {
      return next(new AppError('Model not found or you do not have access', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { model },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string;
    const ownerId = req.user?.role === 'admin' ? undefined : req.user?.id;

    const models = await modelService.getAllModels(ownerId, projectId);
    res.status(200).json({
      status: 'success',
      results: models.length,
      data: { models },
    });
  } catch (error: any) {
    next(error);
  }
};

export const downloadModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await modelService.getModelById(req.params.id);
    if (!model || (model.owner.id !== req.user?.id && req.user?.role !== 'admin')) {
      return next(new AppError('Model not found or you do not have access', 404));
    }

    const filePath = path.join(config.storagePath, path.basename(model.filePath));
    if (!fs.existsSync(filePath)) {
      return next(new AppError('File not found on server', 404));
    }

    res.download(filePath, model.name, (err) => {
      if (err) {
        return next(new AppError('Error downloading file: ' + err.message, 500));
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await modelService.getModelById(req.params.id);
    if (!model || (model.owner.id !== req.user?.id && req.user?.role !== 'admin')) {
      return next(new AppError('Model not found or you do not have access', 404));
    }

    // Delete file from disk
    const filePath = path.join(config.storagePath, path.basename(model.filePath));
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting model file from disk:', err);
      });
    }

    await modelService.deleteModel(req.params.id, req.user!.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

// Simplified Inference Endpoint
export const runInference = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelId = req.params.id;
    const inputData = req.body.inputData; // Expect input data in request body

    const model = await modelService.getModelById(modelId);
    if (!model || (model.owner.id !== req.user?.id && req.user?.role !== 'admin')) {
      return next(new AppError('Model not found or you do not have access', 404));
    }

    if (!inputData) {
      return next(new AppError('Input data for inference is required.', 400));
    }

    // --- Placeholder for actual ML model loading and inference ---
    // In a real application, this would involve:
    // 1. Loading the model file (e.g., using TensorFlow.js, PyTorch JIT, ONNX Runtime, or a separate microservice)
    // 2. Preprocessing inputData
    // 3. Running model.predict(preprocessed_data)
    // 4. Post-processing the output

    // For this example, we'll return dummy inference results.
    const dummyPrediction = Math.random();
    const result = {
      modelId: model.id,
      inputData: inputData,
      prediction: dummyPrediction,
      confidence: dummyPrediction > 0.5 ? 'high' : 'low',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      status: 'success',
      message: 'Inference simulated successfully.',
      data: result,
    });

  } catch (error: any) {
    next(error);
  }
};
```