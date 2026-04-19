```typescript
import { AppDataSource } from '../config/db';
import { User } from '../models/User';
import { Dataset, FileType } from '../models/Dataset';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';
import { z } from 'zod';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

const createDatasetSchema = z.object({
  name: z.string().min(3, 'Dataset name must be at least 3 characters long'),
  description: z.string().optional(),
  fileType: z.nativeEnum(FileType),
  data: z.string(), // Raw data as string
});

const updateDatasetSchema = z.object({
  name: z.string().min(3, 'Dataset name must be at least 3 characters long').optional(),
  description: z.string().optional(),
});

export const datasetService = {
  /**
   * Creates a new dataset.
   * @param userId ID of the user creating the dataset.
   * @param datasetData Dataset creation data.
   * @returns The newly created dataset.
   * @throws APIError if user not found or validation fails.
   */
  async createDataset(userId: string, datasetData: z.infer<typeof createDatasetSchema>): Promise<Dataset> {
    const validatedData = createDatasetSchema.parse(datasetData);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new APIError('User not found', 404);
    }

    const datasetRepository = AppDataSource.getRepository(Dataset);
    const dataset = datasetRepository.create({
      ...validatedData,
      user: user,
    });
    await datasetRepository.save(dataset);

    logger.info(`Dataset created by user ${userId}: ${dataset.name}`);
    return dataset;
  },

  /**
   * Retrieves all datasets for a specific user.
   * @param userId ID of the user.
   * @returns Array of datasets.
   */
  async getDatasetsByUserId(userId: string): Promise<Dataset[]> {
    const datasetRepository = AppDataSource.getRepository(Dataset);
    const datasets = await datasetRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'description', 'fileType', 'createdAt', 'updatedAt', 'userId'] // Exclude 'data' by default
    });
    return datasets;
  },

  /**
   * Retrieves a single dataset by ID.
   * @param datasetId ID of the dataset.
   * @param userId ID of the user requesting the dataset (for authorization).
   * @param isAdmin Whether the user is an admin.
   * @returns The dataset, including its data.
   * @throws APIError if dataset not found or unauthorized.
   */
  async getDatasetById(datasetId: string, userId: string, isAdmin: boolean = false): Promise<Dataset> {
    const datasetRepository = AppDataSource.getRepository(Dataset);
    const dataset = await datasetRepository.findOne({ where: { id: datasetId } });

    if (!dataset) {
      throw new APIError('Dataset not found', 404);
    }
    if (dataset.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to access this dataset', 403);
    }

    return dataset;
  },

  /**
   * Updates an existing dataset's metadata.
   * @param datasetId ID of the dataset to update.
   * @param userId ID of the user updating (for authorization).
   * @param updateData Update data.
   * @param isAdmin Whether the user is an admin.
   * @returns The updated dataset.
   * @throws APIError if dataset not found, unauthorized, or validation fails.
   */
  async updateDataset(datasetId: string, userId: string, updateData: z.infer<typeof updateDatasetSchema>, isAdmin: boolean = false): Promise<Dataset> {
    const validatedData = updateDatasetSchema.partial().parse(updateData);

    const datasetRepository = AppDataSource.getRepository(Dataset);
    const dataset = await datasetRepository.findOne({ where: { id: datasetId } });

    if (!dataset) {
      throw new APIError('Dataset not found', 404);
    }
    if (dataset.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to update this dataset', 403);
    }

    Object.assign(dataset, validatedData);
    await datasetRepository.save(dataset);

    logger.info(`Dataset updated by user ${userId}: ${dataset.id}`);
    return dataset;
  },

  /**
   * Deletes a dataset.
   * @param datasetId ID of the dataset to delete.
   * @param userId ID of the user deleting (for authorization).
   * @param isAdmin Whether the user is an admin.
   * @throws APIError if dataset not found or unauthorized.
   */
  async deleteDataset(datasetId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const datasetRepository = AppDataSource.getRepository(Dataset);
    const dataset = await datasetRepository.findOne({ where: { id: datasetId } });

    if (!dataset) {
      throw new APIError('Dataset not found', 404);
    }
    if (dataset.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to delete this dataset', 403);
    }

    await datasetRepository.remove(dataset);
    logger.info(`Dataset deleted by user ${userId}: ${dataset.id}`);
  },

  /**
   * Parses CSV data string into an array of objects.
   * @param csvString The CSV data as a string.
   * @returns A promise resolving to an array of parsed data objects.
   */
  async parseCsvData(csvString: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(csvString);
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(new APIError(`Failed to parse CSV data: ${error.message}`, 400)));
    });
  },

  /**
   * Parses JSON data string into an array of objects.
   * @param jsonString The JSON data as a string.
   * @returns A promise resolving to an array of parsed data objects.
   */
  async parseJsonData(jsonString: string): Promise<any[]> {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object' && data !== null) {
        // If it's a single object, wrap it in an array for consistency
        return [data];
      }
      throw new Error('JSON data is not an array or a single object');
    } catch (error: any) {
      throw new APIError(`Failed to parse JSON data: ${error.message}`, 400);
    }
  },
};
```