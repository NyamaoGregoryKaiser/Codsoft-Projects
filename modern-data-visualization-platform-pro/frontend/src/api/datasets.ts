import axiosInstance from './axiosInstance';
import { API_BASE_URL } from '../config/env';
import { Dataset, ColumnMetadata } from '../types/dataset';

interface CreateDatasetPayload {
  name: string;
  description?: string;
  data: object[];
}

interface UpdateDatasetPayload {
  name?: string;
  description?: string;
  data?: object[];
}

/**
 * API service for dataset-related operations.
 */
const DatasetService = {
  /**
   * Fetches all datasets for the authenticated user.
   * @returns A promise that resolves to an array of Dataset objects.
   */
  getAll: async (): Promise<Dataset[]> => {
    const response = await axiosInstance.get<Dataset[]>(`${API_BASE_URL}/datasets`);
    return response.data;
  },

  /**
   * Fetches a single dataset by its ID.
   * @param id - The ID of the dataset.
   * @returns A promise that resolves to a Dataset object.
   */
  getById: async (id: string): Promise<Dataset> => {
    const response = await axiosInstance.get<Dataset>(`${API_BASE_URL}/datasets/${id}`);
    return response.data;
  },

  /**
   * Creates a new dataset.
   * @param payload - The data for the new dataset, including name, description, and the data array.
   * @returns A promise that resolves to the newly created Dataset object.
   */
  create: async (payload: CreateDatasetPayload): Promise<Dataset> => {
    const response = await axiosInstance.post<Dataset>(`${API_BASE_URL}/datasets`, payload);
    return response.data;
  },

  /**
   * Updates an existing dataset.
   * @param id - The ID of the dataset to update.
   * @param payload - The fields to update.
   * @returns A promise that resolves to the updated Dataset object.
   */
  update: async (id: string, payload: UpdateDatasetPayload): Promise<Dataset> => {
    const response = await axiosInstance.put<Dataset>(`${API_BASE_URL}/datasets/${id}`, payload);
    return response.data;
  },

  /**
   * Deletes a dataset.
   * @param id - The ID of the dataset to delete.
   * @returns A promise that resolves when the dataset is successfully deleted.
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_BASE_URL}/datasets/${id}`);
  },

  /**
   * Gets a preview of a dataset's raw data.
   * @param id - The ID of the dataset.
   * @param limit - The maximum number of rows to retrieve for the preview.
   * @returns A promise that resolves to an array of raw data objects.
   */
  getPreview: async (id: string, limit: number = 100): Promise<object[]> => {
    const response = await axiosInstance.get<object[]>(`${API_BASE_URL}/datasets/${id}/preview?limit=${limit}`);
    return response.data;
  },
};

export default DatasetService;