```typescript
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/jwt.service";
import { UserRole } from "../entities/User";
import { AuthPayload, AuthRequest } from "../utils/types";
import { ApiError } from "../utils/api.error";
import logger from "../config/logger";

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = req.header("Authorization");

  if (!token) {
    return next(new ApiError(401, "No token provided"));
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = verifyToken(token) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(error); // ApiError from verifyToken or other parsing errors
  }
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This case should ideally not happen if 'authenticate' middleware runs before 'authorize'
      return next(new ApiError(401, "User not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`User ${req.user.email} with role ${req.user.role} attempted unauthorized access to a ${allowedRoles.join(',')} resource.`);
      return next(new ApiError(403, "Forbidden: You do not have permission to access this resource"));
    }
    next();
  };
};
```