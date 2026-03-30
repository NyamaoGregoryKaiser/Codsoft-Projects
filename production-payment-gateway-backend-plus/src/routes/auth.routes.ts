```typescript
import { Router } from "express";
import * as authController from "../modules/auth/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import { createUserSchema, loginUserSchema } from "../modules/auth/auth.validation";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", validate(createUserSchema), authController.register);
router.post("/login", validate(loginUserSchema), authController.login);
router.get("/me", authenticate, authController.getMe);

export default router;
```