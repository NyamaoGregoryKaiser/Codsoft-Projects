```typescript
import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import { AuthRequest } from "../../utils/types";
import { asyncHandler } from "../../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  res.status(201).json({ message: "User registered successfully", user: { id: user.id, email: user.email, role: user.role } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login(email, password);
  res.status(200).json({ message: "Logged in successfully", user: { id: user.id, email: user.email, role: user.role }, token });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ user: { id: user.id, email: user.email, role: user.role, merchantId: user.merchant?.id } });
});
```