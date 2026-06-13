```typescript
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
```