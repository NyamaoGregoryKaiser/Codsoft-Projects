import api from './axios';
import { Merchant } from '@/types/merchant'; // Assuming a Merchant type

export const getMerchants = async (): Promise<Merchant[]> => {
  const response = await api.get<Merchant[]>('/merchants');
  return response.data;
};

export const getMerchant = async (id: string): Promise<Merchant> => {
  const response = await api.get<Merchant>(`/merchants/${id}`);
  return response.data;
};

export const createMerchant = async (data: Partial<Merchant>): Promise<Merchant> => {
  const response = await api.post<Merchant>('/merchants', data);
  return response.data;
};

export const updateMerchant = async (id: string, data: Partial<Merchant>): Promise<Merchant> => {
  const response = await api.patch<Merchant>(`/merchants/${id}`, data);
  return response.data;
};

export const deleteMerchant = async (id: string): Promise<void> => {
  await api.delete(`/merchants/${id}`);
};

export const regenerateMerchantApiKeys = async (id: string): Promise<{ apiKey: string; apiSecret: string }> => {
  const response = await api.post<{ apiKey: string; apiSecret: string }>(`/merchants/${id}/regenerate-api-keys`);
  return response.data;
};