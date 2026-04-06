import apiClient from './apiClient';

export const getRecommendations = async (dbConnectionId, status = 'pending') => {
  const response = await apiClient.get(`/databases/${dbConnectionId}/recommendations?status=${status}`);
  return response.data.data;
};

export const updateRecommendationStatus = async (dbConnectionId, recommendationId, newStatus) => {
  const response = await apiClient.put(`/databases/${dbConnectionId}/recommendations/${recommendationId}`, { status: newStatus });
  return response.data.data;
};