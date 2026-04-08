export interface TransactionSummary {
  totalSuccessfulCharges: number;
  successfulChargeCount: number;
  totalRefundedAmount: number;
  refundCount: number;
  totalFailedTransactions: number;
  totalPendingTransactions: number;
  netVolume: number;
}

export interface DailyTransactionsReport {
  date: string; // YYYY-MM-DD
  capturedAmount: number;
  capturedCount: number;
  refundedAmount: number;
  refundCount: number;
  failedCount: number;
  netVolume: number;
}