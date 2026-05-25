import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../shared/utils/catchAsync';
import * as datasetService from './dataset.service';
import { CreateDatasetDTO, UpdateDatasetDTO } from './dataset.dto';
import ApiError from '../../shared/errors/ApiError';
import { clearCache } from '../../middleware/cache';

export const createDataset = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated.');
  }
  const datasetData: CreateDatasetDTO = { ...req.body, userId: req.user.id };
  // In a real app, you'd handle file upload here (e.g., multer + S3/GCS)
  // For this demo, `filePath` is directly provided in the DTO
  if (!datasetData.filePath) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'File path is required.');
  }
  const dataset = await datasetService.createDataset(datasetData);
  await clearCache('/api/v1/datasets*'); // Clear all dataset caches
  res.status(httpStatus.CREATED).send(dataset);
});

export const getDatasets = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated.');
  }
  const datasets = await datasetService.getDatasetsByUserId(req.user.id);
  res.send(datasets);
});

export const getDataset = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated.');
  }
  const dataset = await datasetService.getDatasetById(req.params.datasetId, req.user.id);
  if (!dataset) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dataset not found');
  }
  res.send(dataset);
});

export const updateDataset = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated.');
  }
  const dataset = await datasetService.updateDataset(req.params.datasetId, req.user.id, req.body as UpdateDatasetDTO);
  await clearCache(`/api/v1/datasets/${req.params.datasetId}`); // Clear specific dataset cache
  await clearCache('/api/v1/datasets'); // Clear list cache
  res.send(dataset);
});

export const deleteDataset = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated.');
  }
  await datasetService.deleteDataset(req.params.datasetId, req.user.id);
  await clearCache(`/api/v1/datasets/${req.params.datasetId}`); // Clear specific dataset cache
  await clearCache('/api/v1/datasets'); // Clear list cache
  res.status(httpStatus.NO_CONTENT).send();
});