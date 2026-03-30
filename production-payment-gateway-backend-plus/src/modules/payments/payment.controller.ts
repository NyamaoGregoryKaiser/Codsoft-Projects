```typescript
import { Request, Response, NextFunction } from "express";
import * as paymentService from "./payment.service";
import { AuthRequest } from "../../utils/types";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/api.error";
import logger from "../../config/logger";

// Initiate a new payment
export const initiatePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.merchantId) {
    throw new ApiError(403, "Only merchants can initiate payments");
  }

  const paymentData = {
    ...req.body,
    merchantId: req.user.merchantId,
  };

  const transaction = await paymentService.initiatePayment(paymentData);
  res.status(201).json({
    message: "Payment initiated successfully",
    transactionId: transaction.id,
    status: transaction.status,
    // In a real system, you'd return a payment page URL or a client secret
    paymentUrl: `/payments/${transaction.id}/process`, // Placeholder
  });
});

// Simulate a payment callback from a gateway (or internal processing)
export const handlePaymentCallback = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId, status, gatewayReference, amount, currency } = req.body; // Simplified payload

  if (!transactionId || !status) {
    throw new ApiError(400, "Missing transactionId or status in callback");
  }

  const transaction = await paymentService.processPaymentCallback(
    transactionId,
    status,
    gatewayReference,
    amount,
    currency
  );
  res.status(200).json({
    message: `Payment callback processed. Transaction ${transaction.id} status: ${transaction.status}`,
    transactionId: transaction.id,
    status: transaction.status,
  });
});

// Get payment details
export const getPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const transaction = await paymentService.getPaymentById(id);

  if (!req.user || (req.user.role === "MERCHANT" && transaction.merchant.id !== req.user.merchantId)) {
    throw new ApiError(403, "Unauthorized to view this payment");
  }

  res.status(200).json(transaction);
});

// Initiate a refund for a payment
export const initiateRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.merchantId) {
    throw new ApiError(403, "Only merchants can initiate refunds");
  }

  const { id: transactionId } = req.params;
  const { amount } = req.body;

  const refund = await paymentService.initiateRefund(transactionId, amount, req.user.merchantId);
  res.status(201).json({
    message: "Refund initiated successfully",
    refundId: refund.id,
    status: refund.status,
  });
});

// Handle webhook events from external payment gateways
export const handleGatewayWebhook = asyncHandler(async (req: Request, res: Response) => {
  // This endpoint would receive webhooks directly from external payment gateways (e.g., Stripe, PayPal)
  // The structure of the payload depends on the gateway.
  // We would typically verify the webhook signature here.
  logger.info("Received gateway webhook:", req.body);

  // Example: process a simulated successful payment event from a gateway
  const { eventType, data } = req.body; // Simplified gateway webhook structure

  if (eventType === "payment.succeeded") {
    const { transactionId, gatewayReference, amount, currency } = data;
    await paymentService.processPaymentCallback(transactionId, "SUCCESS", gatewayReference, amount, currency);
    logger.info(`Processed gateway webhook for successful payment: ${transactionId}`);
  } else if (eventType === "payment.failed") {
    const { transactionId, gatewayReference, amount, currency } = data;
    await paymentService.processPaymentCallback(transactionId, "FAILED", gatewayReference, amount, currency);
    logger.info(`Processed gateway webhook for failed payment: ${transactionId}`);
  }
  // Add more event types (refunds, disputes, etc.) as needed

  res.status(200).json({ received: true });
});
```