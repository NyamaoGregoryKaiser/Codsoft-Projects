```typescript
import Joi from "joi";
import { UserRole } from "../../entities/User";

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(UserRole.ADMIN, UserRole.MERCHANT).default(UserRole.MERCHANT),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export type CreateUserDto = Joi. সুtils.extractType<typeof createUserSchema>;
export type LoginUserDto = Joi. সুtils.extractType<typeof loginUserSchema>;
```