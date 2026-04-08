import { Injectable, Logger } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '../database/entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfigService } from '@nestjs/config';

// This service simulates interaction with an external payment gateway like Stripe, PayPal, etc.
// In a real application, this would involve making actual HTTP requests to the gateway's API.

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PAYMENT_GATEWAY_API_KEY');
    this.apiSecret = this.configService.get<string>('PAYMENT_GATEWAY_SECRET');
  }

  // Simulate a charge/capture request
  async processCharge(
    transactionId: string,
    amount: number,
    currency: string,
    paymentMethodToken: string,
    customerEmail?: string,
    description?: string,
  ): Promise<{ gatewayTransactionId: string; status: TransactionStatus }> {
    this.logger.log(`Simulating charge for transaction ${transactionId} with amount ${amount} ${currency}`);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate success or failure based on some conditions (e.g., amount, token)
    if (amount <= 0) {
      this.logger.error(`Charge failed for transaction ${transactionId}: Invalid amount`);
      return { gatewayTransactionId: null, status: TransactionStatus.FAILED };
    }
    if (paymentMethodToken === 'mock_fail_token') {
        this.logger.error(`Charge failed for transaction ${transactionId}: Mock failure token used`);
        return { gatewayTransactionId: null, status: TransactionStatus.FAILED };
    }

    const gatewayTransactionId = `gtw_charge_${Date.now()}_${transactionId}`;
    this.logger.log(`Charge successful for transaction ${transactionId}. Gateway ID: ${gatewayTransactionId}`);
    return { gatewayTransactionId, status: TransactionStatus.CAPTURED };
  }

  // Simulate a refund request
  async processRefund(
    originalGatewayTransactionId: string,
    transactionId: string,
    amount: number,
    currency: string,
  ): Promise<{ gatewayTransactionId: string; status: TransactionStatus }> {
    this.logger.log(
      `Simulating refund for original gateway transaction ${originalGatewayTransactionId}, new transaction ${transactionId} with amount ${amount} ${currency}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (amount <= 0) {
      this.logger.error(`Refund failed for transaction ${transactionId}: Invalid amount`);
      return { gatewayTransactionId: null, status: TransactionStatus.FAILED };
    }

    const gatewayTransactionId = `gtw_refund_${Date.now()}_${transactionId}`;
    this.logger.log(`Refund successful for transaction ${transactionId}. Gateway ID: ${gatewayTransactionId}`);
    return { gatewayTransactionId, status: TransactionStatus.REFUNDED };
  }

  // Simulate a void request (only possible for pending/authorized charges)
  async processVoid(
    originalGatewayTransactionId: string,
    transactionId: string,
  ): Promise<{ gatewayTransactionId: string; status: TransactionStatus }> {
    this.logger.log(
      `Simulating void for original gateway transaction ${originalGatewayTransactionId}, new transaction ${transactionId}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 600));

    const gatewayTransactionId = `gtw_void_${Date.now()}_${transactionId}`;
    this.logger.log(`Void successful for transaction ${transactionId}. Gateway ID: ${gatewayTransactionId}`);
    return { gatewayTransactionId, status: TransactionStatus.VOIDED };
  }
}