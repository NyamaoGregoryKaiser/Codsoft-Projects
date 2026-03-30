```typescript
import { AppDataSource } from "../../database/data-source";
import { Transaction, TransactionStatus, TransactionType } from "../../entities/Transaction";
import { Merchant } from "../../entities/Merchant";
import { Refund, RefundStatus } from "../../entities/Refund";
import { ApiError } from "../../utils/api.error";
import { InitiatePaymentDto, InitiateRefundDto } from "./payment.validation";
import * as paymentGatewayService from "../../services/paymentGateway.service";
import * as webhookService from "../webhooks/webhook.service";
import logger from "../../config/logger";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs if not using TypeORM's default

const transactionRepository = AppDataSource.getRepository(Transaction);
const merchantRepository = AppDataSource.getRepository(Merchant);
const refundRepository = AppDataSource.getRepository(Refund);

export const initiatePayment = async (data: InitiatePaymentDto & { merchantId: string }): Promise<Transaction> => {
  const { merchantId, amount, currency, description, customerId, callbackUrl } = data;

  const merchant = await merchantRepository.findOneBy({ id: merchantId });
  if (!merchant) {
    throw new ApiError(404, "Merchant not found");
  }

  // Simulate interaction with an external payment gateway
  // In a real system, this would involve sending the payment details to a provider (Stripe, PayPal, etc.)
  // and getting back a client secret or redirect URL.
  const gatewayResponse = await paymentGatewayService.processPaymentRequest({
    amount,
    currency,
    description,
    merchantName: merchant.name,
    // other gateway-specific parameters
  });

  const transaction = transactionRepository.create({
    merchant,
    amount,
    currency,
    description,
    type: TransactionType.SALE,
    status: TransactionStatus.PENDING, // Or gatewayResponse.status
    gatewayReference: gatewayResponse.reference, // Reference from the external gateway
    customerIdentifier: customerId, // Optional customer identifier
    callbackUrl, // URL provided by the merchant for webhook notifications
  });

  await transactionRepository.save(transaction);
  logger.info(`Payment initiated for merchant ${merchant.id}, transaction ${transaction.id}`);
  return transaction;
};

export const processPaymentCallback = async (
  transactionId: string,
  status: "SUCCESS" | "FAILED",
  gatewayReference?: string,
  actualAmount?: number, // The amount confirmed by the gateway
  actualCurrency?: string // The currency confirmed by the gateway
): Promise<Transaction> => {
  const transaction = await transactionRepository.findOne({
    where: { id: transactionId },
    relations: ["merchant"],
  });

  if (!transaction) {
    logger.warn(`Payment callback received for non-existent transaction: ${transactionId}`);
    throw new ApiError(404, "Transaction not found");
  }

  if (transaction.status !== TransactionStatus.PENDING && transaction.status !== TransactionStatus.PROCESSING) {
    logger.warn(`Payment callback received for transaction ${transaction.id} which is already in ${transaction.status} state.`);
    // Potentially handle duplicate callbacks gracefully, maybe return current state.
    return transaction;
  }

  // Update transaction status based on callback
  if (status === "SUCCESS") {
    transaction.status = TransactionStatus.SUCCESS;
    transaction.processedAt = new Date();
    // Potentially update amount/currency if different from initial request
    if (actualAmount) transaction.amount = actualAmount;
    if (actualCurrency) transaction.currency = actualCurrency;
    if (gatewayReference) transaction.gatewayReference = gatewayReference;

    logger.info(`Transaction ${transaction.id} successfully processed. Amount: ${transaction.amount} ${transaction.currency}`);
    // Dispatch webhook for successful payment
    await webhookService.dispatchWebhook(transaction.merchant.id, "payment.succeeded", transaction);

  } else if (status === "FAILED") {
    transaction.status = TransactionStatus.FAILED;
    transaction.processedAt = new Date();
    if (gatewayReference) transaction.gatewayReference = gatewayReference;

    logger.warn(`Transaction ${transaction.id} failed.`);
    // Dispatch webhook for failed payment
    await webhookService.dispatchWebhook(transaction.merchant.id, "payment.failed", transaction);

  } else {
    throw new ApiError(400, "Invalid payment callback status");
  }

  await transactionRepository.save(transaction);
  return transaction;
};

export const getPaymentById = async (transactionId: string): Promise<Transaction> => {
  const transaction = await transactionRepository.findOne({
    where: { id: transactionId },
    relations: ["merchant", "refunds"],
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }
  return transaction;
};

export const initiateRefund = async (
  transactionId: string,
  refundAmount: number,
  merchantId: string
): Promise<Refund> => {
  const transaction = await transactionRepository.findOne({
    where: { id: transactionId },
    relations: ["merchant"],
  });

  if (!transaction || transaction.merchant.id !== merchantId) {
    throw new ApiError(404, "Transaction not found or unauthorized");
  }

  if (transaction.status !== TransactionStatus.SUCCESS) {
    throw new ApiError(400, "Only successful transactions can be refunded");
  }

  // Calculate total refunded amount so far
  const totalRefunded = await refundRepository
    .createQueryBuilder("refund")
    .select("SUM(refund.amount)", "sum")
    .where("refund.transaction = :transactionId", { transactionId })
    .andWhere("refund.status IN (:...statuses)", {
      statuses: [RefundStatus.PENDING, RefundStatus.SUCCESS],
    })
    .getRawOne();

  const currentRefundedAmount = parseFloat(totalRefunded.sum || 0);
  const remainingRefundableAmount = transaction.amount - currentRefundedAmount;

  if (refundAmount <= 0 || refundAmount > remainingRefundableAmount) {
    throw new ApiError(
      400,
      `Invalid refund amount. Max refundable: ${remainingRefundableAmount} ${transaction.currency}`
    );
  }

  // Simulate calling the external payment gateway for refund
  const gatewayRefundResponse = await paymentGatewayService.processRefundRequest({
    transactionReference: transaction.gatewayReference,
    amount: refundAmount,
    currency: transaction.currency,
  });

  const refund = refundRepository.create({
    transaction,
    amount: refundAmount,
    currency: transaction.currency,
    status: RefundStatus.PENDING, // Or gatewayRefundResponse.status
    gatewayReference: gatewayRefundResponse.reference,
  });

  await refundRepository.save(refund);

  // Update transaction status if fully refunded
  if (remainingRefundableAmount - refundAmount <= 0) {
    transaction.status = TransactionStatus.REFUNDED;
    await transactionRepository.save(transaction);
  }

  logger.info(`Refund initiated for transaction ${transactionId}, refund ${refund.id}. Amount: ${refundAmount}`);
  await webhookService.dispatchWebhook(merchantId, "refund.succeeded", refund); // Or refund.failed
  return refund;
};
```