import api from './axios';
import { CreateTransactionDto, RefundTransactionDto, Transaction, PaginatedResponse } from '@/types/transaction'; // Assuming these types

export const createCharge = async (data: CreateTransactionDto): Promise<Transaction> => {
  const response = await api.post<Transaction>('/transactions/charge', data);
  return response.data;
};

export const refundTransaction = async (id: string, data: RefundTransactionDto): Promise<Transaction> => {
  const response = await api.patch<Transaction>(`/transactions/${id}/refund`, data);
  return response.data;
};

export const voidTransaction = async (id: string): Promise<Transaction> => {
  const response = await api.patch<Transaction>(`/transactions/${id}/void`);
  return response.data;
};

export const getTransactions = async (
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<Transaction>> => {
  const response = await api.get<PaginatedResponse<Transaction>>(`/transactions?page=${page}&limit=${limit}`);
  return response.data;
};

export const getTransaction = async (id: string): Promise<Transaction> => {
  const response = await api.get<Transaction>(`/transactions/${id}`);
  return response.data;
};