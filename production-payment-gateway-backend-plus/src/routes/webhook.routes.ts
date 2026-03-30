```typescript
import { Router } from "express";
import * as webhookController from "../modules/webhooks/webhook.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "../entities/User";
import { createWebhookSubscriptionSchema } from "../modules/webhooks/webhook.validation";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

router.post(
  "/subscriptions",
  authenticate,
  authorize([UserRole.MERCHANT]),
  validate(createWebhookSubscriptionSchema),
  webhookController.createSubscription
);
router.get(
  "/subscriptions",
  authenticate,
  authorize([UserRole.MERCHANT]),
  webhookController.getMerchantSubscriptions
);
router.delete(
  "/subscriptions/:id",
  authenticate,
  authorize([UserRole.MERCHANT]),
  webhookController.deleteSubscription
);

// Admin can view all subscriptions (optional)
router.get(
  "/admin/subscriptions",
  authenticate,
  authorize([UserRole.ADMIN]),
  webhookController.getAllSubscriptions
);

export default router;
```