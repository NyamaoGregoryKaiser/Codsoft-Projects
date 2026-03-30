```typescript
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/api.error";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.length === 0) {
    throw new ApiError(400, "Password cannot be empty");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```