```typescript
import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import merchantRoutes from "./merchant.routes";
import paymentRoutes from "./payment.routes";
import webhookRoutes from "./webhook.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/merchants", merchantRoutes);
router.use("/payments", paymentRoutes);
router.use("/webhooks", webhookRoutes);

export default router;
```