import api from './axios';
import { TransactionSummary, DailyTransactionsReport } from '@/types/reporting';

interface DateRange {
  startDate?: string; // ISO 8601 string
  endDate?: string;   // ISO 8601 string
}

export const getTransactionSummary = async (dateRange?: DateRange): Promise<TransactionSummary> => {
  const response = await api.get<TransactionSummary>('/reporting/summary', { params: dateRange });
  return response.data;
};

export const getDailyTransactions = async (dateRange: Required<DateRange>): Promise<DailyTransactionsReport[]> => {
  const response = await api.get<DailyTransactionsReport[]>('/reporting/daily', { params: dateRange });
  return response.data;
};