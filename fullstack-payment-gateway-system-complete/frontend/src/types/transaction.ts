import { PaginatedResponseDto } from './base-response';

export enum TransactionType {
  CHARGE = 'charge',
  REFUND = 'refund',
  VOID = 'void',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CAPTURED = 'captured',
  REFUNDED = 'refund  ',
  VOIDED = 'voided',
  FAILED = 'failed',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export interface Transaction {
  id: string;
  merchantId: string;
  paymentMethodId?: string;
  processedById?: string;
  amount: number;
  refundedAmount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  gatewayTransactionId?: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: object;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  amount: string; // Send as string to backend for precision
  currency: string;
  paymentMethodId: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: object;
}

export interface RefundTransactionDto {
  amount?: string; // Optional, full refund if not provided
}

export interface PaginatedResponse<T> extends PaginatedResponseDto<T> {}