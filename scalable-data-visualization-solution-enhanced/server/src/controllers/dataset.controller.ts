```typescript
import { Request, Response, NextFunction } from 'express';
import { datasetService } from '../services/dataset.service';
import { APIError } from '../utils/errors';
import { FileType } from '../models/Dataset';
import { logger } from '../utils/logger';

export const datasetController = {
  async createDataset(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      if (!req.file) {
        throw new APIError('No file uploaded', 400);
      }

      const { name, description } = req.body;
      const fileBuffer = req.file.buffer;
      const originalname = req.file.originalname;
      const fileExtension = originalname.split('.').pop()?.toLowerCase();

      let fileType: FileType;
      if (fileExtension === 'csv') {
        fileType = FileType.CSV;
      } else if (fileExtension === 'json') {
        fileType = FileType.JSON;
      } else {
        throw new APIError('Unsupported file type. Only CSV and JSON are allowed.', 400);
      }

      const dataset = await datasetService.createDataset(req.user.id, {
        name,
        description,
        fileType,
        data: fileBuffer.toString('utf8'), // Store data as string
      });

      res.status(201).json({ message: 'Dataset uploaded successfully', dataset });
    } catch (error) {
      next(error);
    }
  },

  async getDatasets(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const datasets = await datasetService.getDatasetsByUserId(req.user.id);
      res.status(200).json(datasets);
    } catch (error) {
      next(error);
    }
  },

  async getDatasetById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const datasetId = req.params.id;
      const dataset = await datasetService.getDatasetById(datasetId, req.user.id, req.user.role === 'admin');
      res.status(200).json(dataset);
    } catch (error) {
      next(error);
    }
  },

  async updateDataset(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const datasetId = req.params.id;
      const dataset = await datasetService.updateDataset(datasetId, req.user.id, req.body, req.user.role === 'admin');
      res.status(200).json({ message: 'Dataset updated successfully', dataset });
    } catch (error) {
      next(error);
    }
  },

  async deleteDataset(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const datasetId = req.params.id;
      await datasetService.deleteDataset(datasetId, req.user.id, req.user.role === 'admin');
      res.status(200).json({ message: 'Dataset deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getDatasetData(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const datasetId = req.params.id;
      const dataset = await datasetService.getDatasetById(datasetId, req.user.id, req.user.role === 'admin');

      let parsedData: any[] = [];
      if (dataset.fileType === FileType.CSV) {
        parsedData = await datasetService.parseCsvData(dataset.data);
      } else if (dataset.fileType === FileType.JSON) {
        parsedData = await datasetService.parseJsonData(dataset.data);
      }

      res.status(200).json(parsedData);
    } catch (error) {
      next(error);
    }
  }
};
```