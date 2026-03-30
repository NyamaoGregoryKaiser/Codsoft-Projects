```typescript
import { Router } from "express";
import * as merchantController from "../modules/merchants/merchant.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "../entities/User";
import { createMerchantSchema, updateMerchantSchema } from "../modules/merchants/merchant.validation";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

// Admin-only for full CRUD
router.post("/", authenticate, authorize([UserRole.ADMIN]), validate(createMerchantSchema), merchantController.createMerchant);
router.get("/", authenticate, authorize([UserRole.ADMIN]), merchantController.getAllMerchants);
router.get("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MERCHANT]), merchantController.getMerchantById); // Merchants can view their own
router.put("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MERCHANT]), validate(updateMerchantSchema), merchantController.updateMerchant); // Merchants can update their own details
router.delete("/:id", authenticate, authorize([UserRole.ADMIN]), merchantController.deleteMerchant);

export default router;
```