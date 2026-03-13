```typescript
import { User } from './entities';
import { UserRole } from './enums';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role?: UserRole; // Optional, defaults to USER on backend unless specified by admin
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
```