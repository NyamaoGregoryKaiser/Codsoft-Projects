```typescript
import jwt from "jsonwebtoken";
import config from "../config";
import { AuthPayload } from "../utils/types";
import { ApiError } from "../utils/api.error";
import logger from "../config/logger";

export const generateToken = (payload: AuthPayload): string => {
  const token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
  logger.debug(`Generated JWT for user ${payload.id}`);
  return token;
};

export const verifyToken = (token: string): AuthPayload => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    logger.debug(`Verified JWT for user ${decoded.id}`);
    return decoded;
  } catch (error: any) {
    logger.warn(`JWT verification failed: ${error.message}`);
    throw new ApiError(401, "Invalid token");
  }
};
```