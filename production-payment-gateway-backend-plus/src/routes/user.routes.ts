```typescript
import { Router } from "express";
import * as userController from "../modules/users/user.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "../entities/User";
import { updateUserSchema } from "../modules/users/user.validation";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

// Admin-only operations
router.get("/", authenticate, authorize([UserRole.ADMIN]), userController.getAllUsers);
router.get("/:id", authenticate, authorize([UserRole.ADMIN]), userController.getUserById);
router.put("/:id", authenticate, authorize([UserRole.ADMIN]), validate(updateUserSchema), userController.updateUser);
router.delete("/:id", authenticate, authorize([UserRole.ADMIN]), userController.deleteUser);

export default router;
```