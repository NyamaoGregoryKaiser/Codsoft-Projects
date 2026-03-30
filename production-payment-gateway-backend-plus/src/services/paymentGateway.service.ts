```typescript
// This file would contain logic to interact with actual external payment gateways (e.g., Stripe, PayPal, etc.)
// For this project, it's a mock implementation.
import logger from "../config/logger";
import { ApiError } from "../utils/api.error";
import { v4 as uuidv4 } from 'uuid';

interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  merchantName?: string;
  // Other gateway specific parameters like card token, customer ID etc.
}

interface GatewayPaymentResponse {
  success: boolean;
  reference: string; // Gateway's internal reference ID
  status: "PENDING" | "SUCCESS" | "FAILED";
  message?: string;
}

interface RefundRequest {
  transactionReference: string; // Gateway's reference for the original transaction
  amount: number;
  currency: string;
}

interface GatewayRefundResponse {
  success: boolean;
  reference: string; // Gateway's internal reference ID for the refund
  status: "PENDING" | "SUCCESS" | "FAILED";
  message?: string;
}

/**
 * Mocks a payment initiation request to an external payment gateway.
 * In a real scenario, this would involve HTTP calls to the gateway's API.
 * @param request
 * @returns
 */
export const processPaymentRequest = async (request: PaymentRequest): Promise<GatewayPaymentResponse> => {
  logger.info(`[Mock Gateway] Processing payment request: ${JSON.stringify(request)}`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate success or failure
  const isSuccess = Math.random() > 0.1; // 90% success rate
  const gatewayReference = `gw_pay_${uuidv4()}`;

  if (isSuccess) {
    logger.info(`[Mock Gateway] Payment successful for ref: ${gatewayReference}`);
    return {
      success: true,
      reference: gatewayReference,
      status: "PENDING", // Actual payment might become PENDING or PROCESSING on gateway before final status
      message: "Payment request sent to gateway successfully. Awaiting final confirmation."
    };
  } else {
    logger.error(`[Mock Gateway] Payment failed for request: ${JSON.stringify(request)}`);
    throw new ApiError(500, "Payment gateway processing failed (mocked)");
    // In a real scenario, you'd return the gateway's error message
    // return {
    //   success: false,
    //   reference: gatewayReference,
    //   status: "FAILED",
    //   message: "Payment rejected by gateway."
    // };
  }
};

/**
 * Mocks a refund request to an external payment gateway.
 * @param request
 * @returns
 */
export const processRefundRequest = async (request: RefundRequest): Promise<GatewayRefundResponse> => {
  logger.info(`[Mock Gateway] Processing refund request: ${JSON.stringify(request)}`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const isSuccess = Math.random() > 0.05; // 95% success rate for refunds
  const gatewayReference = `gw_refund_${uuidv4()}`;

  if (isSuccess) {
    logger.info(`[Mock Gateway] Refund successful for ref: ${gatewayReference}`);
    return {
      success: true,
      reference: gatewayReference,
      status: "PENDING", // Refunds also might be PENDING on gateway before final status
      message: "Refund request sent to gateway successfully."
    };
  } else {
    logger.error(`[Mock Gateway] Refund failed for request: ${JSON.stringify(request)}`);
    throw new ApiError(500, "Payment gateway refund failed (mocked)");
    // return {
    //   success: false,
    //   reference: gatewayReference,
    //   status: "FAILED",
    //   message: "Refund rejected by gateway."
    // };
  }
};
```