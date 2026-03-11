import axiosInstance from './axiosInstance';
import { Dashboard, Visualization } from '../types';

export const getDashboardsApi = () => {
  return axiosInstance.get<Dashboard[]>('/dashboards');
};

export const getDashboardByIdApi = (id: number) => {
  return axiosInstance.get<Dashboard>(`/dashboards/${id}`);
};

export const createDashboardApi = (dashboard: Omit<Dashboard, 'id' | 'ownerUsername' | 'createdAt' | 'updatedAt' | 'visualizations'>) => {
  return axiosInstance.post<Dashboard>('/dashboards', dashboard);
};

export const updateDashboardApi = (id: number, dashboard: Partial<Omit<Dashboard, 'visualizations'>>) => {
  return axiosInstance.put<Dashboard>(`/dashboards/${id}`, dashboard);
};

export const deleteDashboardApi = (id: number) => {
  return axiosInstance.delete(`/dashboards/${id}`);
};

// Visualization specific API calls that could be nested under a dashboard context
export const getVisualizationsByDashboardApi = (dashboardId: number) => {
  return axiosInstance.get<Visualization[]>(`/dashboards/${dashboardId}/visualizations`);
}