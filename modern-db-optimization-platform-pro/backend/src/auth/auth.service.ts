```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userService } from '../users/user.service';
import { HttpError } from '../shared/http-error';
import { config } from '../config';
import { User } from '../users/user.entity';

export class AuthService {
  async login(username: string, passwordPlain: string): Promise<{ token: string; user: { id: string; username: string; role: string } }> {
    const user = await userService.findByUsername(username);

    if (!user || !(await bcrypt.compare(passwordPlain, user.password))) {
      throw new HttpError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
}

export const authService = new AuthService();
```