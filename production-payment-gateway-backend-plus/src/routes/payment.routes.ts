```typescript
import { Router } from "express";
import * as paymentController from "../modules/payments/payment.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "../entities/User";
import { initiatePaymentSchema, initiateRefundSchema, processPaymentCallbackSchema } from "../modules/payments/payment.validation";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

// Merchant specific routes (initiate, get their payments, initiate refunds)
router.post(
  "/initiate",
  authenticate,
  authorize([UserRole.MERCHANT]),
  validate(initiatePaymentSchema),
  paymentController.initiatePayment
);
router.get("/:id", authenticate, paymentController.getPayment); // Merchant can see their own, Admin can see all
router.post(
  "/:id/refunds",
  authenticate,
  authorize([UserRole.MERCHANT]),
  validate(initiateRefundSchema),
  paymentController.initiateRefund
);

// Internal/Gateway callback endpoint (no authentication needed, relies on internal secret/IP whitelisting in real-world)
// For this example, we assume internal system or gateway calling it securely.
router.post(
  "/callback",
  validate(processPaymentCallbackSchema),
  paymentController.handlePaymentCallback
);

// Endpoint for external payment gateway webhooks (e.g., Stripe, PayPal notifications)
// These typically have their own signature verification mechanisms, which would be added in a real scenario.
router.post("/gateway-webhook", paymentController.handleGatewayWebhook);


export default router;
```