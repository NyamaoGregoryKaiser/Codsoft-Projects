import axios from './axiosConfig';

export const analyzeQuery = async (connectionId, query) => {
  const response = await axios.post('/queries/analyze', { connectionId, query });
  return response.data;
};

export const getAnalysisHistory = async (connectionId) => {
  const response = await axios.get(`/queries/history/${connectionId}`);
  return response.data;
};

export const getAnalysisDetails = async (analysisId) => {
  const response = await axios.get(`/queries/${analysisId}`);
  return response.data;
};

export const updateSuggestionStatus = async (suggestionId, status) => {
  const response = await axios.put(`/queries/suggestions/${suggestionId}`, { status });
  return response.data;
};