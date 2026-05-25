import api from './axios';

export const oneHotEncodeData = async (data: any[], column: string) => {
  const response = await api.post('/data-utilities/encode/one-hot', { data, column });
  return response.data;
};

export const minMaxScaleData = async (data: any[], column: string) => {
  const response = await api.post('/data-utilities/scale/min-max', { data, column });
  return response.data;
};