import { UserRole } from '@prisma/client';

// To extend the Request object with user data from auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}
```