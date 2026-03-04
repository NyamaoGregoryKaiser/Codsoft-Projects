```typescript
import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (id: string, username: string): string => {
  return jwt.sign({ id, username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwtSecret);
};
```