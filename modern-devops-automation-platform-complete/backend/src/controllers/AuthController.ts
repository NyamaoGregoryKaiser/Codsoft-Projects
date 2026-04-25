```typescript
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../services/UserService';
import { signJwt } from '../utils/jwt';
import { registerSchema, loginSchema } from '../utils/validationSchemas';

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = registerSchema.parse(req.body);
      const newUser = await this.userService.registerUser(userData);
      const token = signJwt({ id: newUser.id, email: newUser.email, username: newUser.username });

      res.status(StatusCodes.CREATED).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await this.userService.loginUser(email, password);
      const token = signJwt({ id: user.id, email: user.email, username: user.username });

      res.status(StatusCodes.OK).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
```