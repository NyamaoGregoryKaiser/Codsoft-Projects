import axiosInstance from './axiosInstance';
import { Visualization, DataQueryResponse } from '../types';

export const getVisualizationsApi = () => {
  return axiosInstance.get<Visualization[]>('/visualizations');
};

export const getVisualizationByIdApi = (id: number) => {
  return axiosInstance.get<Visualization>(`/visualizations/${id}`);
};

export const createVisualizationApi = (visualization: Omit<Visualization, 'id' | 'dataSourceName' | 'ownerUsername' | 'createdAt' | 'updatedAt'>) => {
  return axiosInstance.post<Visualization>('/visualizations', visualization);
};

export const updateVisualizationApi = (id: number, visualization: Partial<Visualization>) => {
  return axiosInstance.put<Visualization>(`/visualizations/${id}`, visualization);
};

export const deleteVisualizationApi = (id: number) => {
  return axiosInstance.delete(`/visualizations/${id}`);
};

export const getVisualizationDataApi = (id: number) => {
  return axiosInstance.get<DataQueryResponse>(`/visualizations/${id}/data`);
};