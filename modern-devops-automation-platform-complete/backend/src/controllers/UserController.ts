```typescript
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../services/UserService';
import { NotFoundError } from '../middlewares/errorHandler';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new NotFoundError('User not authenticated.'); // Should not happen with authMiddleware
      }
      const user = await this.userService.getUserById(req.user.id);
      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      next(error);
    }
  }
}
```