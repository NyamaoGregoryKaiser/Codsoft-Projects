import { Repository } from 'typeorm';
import { Dataset } from '@models/Dataset';
import { AppDataSource } from '@db/data-source';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';

interface DatasetUpdatePayload {
  name?: string;
  description?: string;
  data?: object[];
}

/**
 * @class DatasetService
 * @description Provides business logic for dataset-related operations.
 */
export class DatasetService {
  private datasetRepository: Repository<Dataset>;

  constructor() {
    this.datasetRepository = AppDataSource.getRepository(Dataset);
  }

  /**
   * Creates a new dataset.
   * @param ownerId - The ID of the user who owns the dataset.
   * @param name - The name of the dataset.
   * @param description - An optional description for the dataset.
   * @param data - The actual data of the dataset as an array of JSON objects.
   * @returns The newly created Dataset object.
   */
  public async createDataset(
    ownerId: string,
    name: string,
    description: string = '',
    data: object[]
  ): Promise<Dataset> {
    const newDataset = this.datasetRepository.create({
      ownerId,
      name,
      description,
      data,
      columnMetadata: this.inferColumnMetadata(data),
    });
    await this.datasetRepository.save(newDataset);
    logger.info(`Dataset ${newDataset.id} created for user ${ownerId}`);
    return newDataset;
  }

  /**
   * Retrieves all datasets owned by a specific user.
   * @param ownerId - The ID of the user.
   * @returns An array of Dataset objects.
   */
  public async getDatasetsByUserId(ownerId: string): Promise<Dataset[]> {
    return this.datasetRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'description', 'createdAt', 'updatedAt', 'columnMetadata'] // Exclude 'data' for listing
    });
  }

  /**
   * Retrieves a specific dataset by its ID.
   * @param id - The ID of the dataset.
   * @returns The Dataset object, or null if not found.
   */
  public async getDatasetById(id: string): Promise<Dataset | null> {
    return this.datasetRepository.findOne({
      where: { id },
    });
  }

  /**
   * Updates an existing dataset.
   * @param id - The ID of the dataset to update.
   * @param ownerId - The ID of the user attempting the update (for authorization).
   * @param payload - An object containing fields to update (name, description, data).
   * @returns The updated Dataset object, or null if the dataset was not found or not owned by the user.
   * @throws {AppError} If the dataset does not exist or does not belong to the user.
   */
  public async updateDataset(id: string, ownerId: string, payload: DatasetUpdatePayload): Promise<Dataset | null> {
    const dataset = await this.datasetRepository.findOne({ where: { id } });

    if (!dataset) {
      throw new AppError('Dataset not found.', 404);
    }
    if (dataset.ownerId !== ownerId) {
      throw new AppError('Forbidden: You do not own this dataset.', 403);
    }

    if (payload.name) dataset.name = payload.name;
    if (payload.description !== undefined) dataset.description = payload.description;
    if (payload.data) {
      dataset.data = payload.data;
      dataset.columnMetadata = this.inferColumnMetadata(payload.data);
    }

    await this.datasetRepository.save(dataset);
    logger.info(`Dataset ${id} updated by user ${ownerId}`);
    return dataset;
  }

  /**
   * Deletes a dataset.
   * @param id - The ID of the dataset to delete.
   * @param ownerId - The ID of the user attempting the deletion (for authorization).
   * @returns True if the dataset was deleted, false otherwise.
   * @throws {AppError} If the dataset does not exist or does not belong to the user.
   */
  public async deleteDataset(id: string, ownerId: string): Promise<boolean> {
    const dataset = await this.datasetRepository.findOne({ where: { id } });

    if (!dataset) {
      return false; // Not found, so not deleted
    }
    if (dataset.ownerId !== ownerId) {
      throw new AppError('Forbidden: You do not own this dataset.', 403);
    }

    await this.datasetRepository.remove(dataset);
    logger.info(`Dataset ${id} deleted by user ${ownerId}`);
    return true;
  }

  /**
   * Infers column names and their data types from a sample of dataset rows.
   * This is a basic inference and can be expanded for more complex types.
   * @param data - The dataset's data array.
   * @returns An array of ColumnMetadata objects.
   */
  private inferColumnMetadata(data: object[]): { name: string; type: string }[] {
    if (!data || data.length === 0) {
      return [];
    }

    const firstRow = data[0];
    const metadata: { name: string; type: string }[] = [];

    for (const key in firstRow) {
      if (Object.prototype.hasOwnProperty.call(firstRow, key)) {
        let type = 'string'; // Default type

        const sampleValue = (firstRow as any)[key];
        if (typeof sampleValue === 'number') {
          type = 'number';
        } else if (typeof sampleValue === 'boolean') {
          type = 'boolean';
        } else if (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue))) {
          type = 'date';
        }

        metadata.push({ name: key, type });
      }
    }
    return metadata;
  }
}