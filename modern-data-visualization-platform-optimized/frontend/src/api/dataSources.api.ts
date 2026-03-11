import axiosInstance from './axiosInstance';
import { DataSource } from '../types';

export const getDataSourcesApi = () => {
  return axiosInstance.get<DataSource[]>('/data-sources');
};

export const getDataSourceByIdApi = (id: number) => {
  return axiosInstance.get<DataSource>(`/data-sources/${id}`);
};

export const createDataSourceApi = (dataSource: Omit<DataSource, 'id' | 'ownerUsername' | 'createdAt' | 'updatedAt'>) => {
  return axiosInstance.post<DataSource>('/data-sources', dataSource);
};

export const updateDataSourceApi = (id: number, dataSource: Partial<DataSource>) => {
  return axiosInstance.put<DataSource>(`/data-sources/${id}`, dataSource);
};

export const deleteDataSourceApi = (id: number) => {
  return axiosInstance.delete(`/data-sources/${id}`);
};