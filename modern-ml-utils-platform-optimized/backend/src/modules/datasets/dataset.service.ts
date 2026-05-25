import httpStatus from 'http-status';
import ApiError from '../../shared/errors/ApiError';
import AppDataSource from '../../database/datasource';
import { Dataset } from './entities/Dataset';
import { CreateDatasetDTO, UpdateDatasetDTO } from './dataset.dto';

const datasetRepository = AppDataSource.getRepository(Dataset);

export const createDataset = async (datasetData: CreateDatasetDTO): Promise<Dataset> => {
  const dataset = datasetRepository.create(datasetData);
  await datasetRepository.save(dataset);
  return dataset;
};

export const getDatasetsByUserId = async (userId: string): Promise<Dataset[]> => {
  return datasetRepository.find({ where: { userId }, order: { uploadedAt: 'DESC' } });
};

export const getDatasetById = async (datasetId: string, userId: string): Promise<Dataset | null> => {
  const dataset = await datasetRepository.findOne({ where: { id: datasetId, userId } });
  return dataset;
};

export const updateDataset = async (datasetId: string, userId: string, updateData: UpdateDatasetDTO): Promise<Dataset> => {
  const dataset = await datasetRepository.findOne({ where: { id: datasetId, userId } });
  if (!dataset) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dataset not found or unauthorized');
  }
  Object.assign(dataset, updateData);
  await datasetRepository.save(dataset);
  return dataset;
};

export const deleteDataset = async (datasetId: string, userId: string): Promise<void> => {
  const result = await datasetRepository.delete({ id: datasetId, userId });
  if (result.affected === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dataset not found or unauthorized');
  }
};