```typescript
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { UserRole } from '../types/enums';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const generateToken = (id: string, email: string, role: UserRole): string => {
  const payload: JwtPayload = { id, email, role };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
```