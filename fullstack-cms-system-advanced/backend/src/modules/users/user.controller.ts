import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './user.dtos';
import { validateRequest } from '../../utils/validation';
import { authorize } from '../../middlewares/auth.middleware';
import { clearCacheMiddleware } from '../../middlewares/cache.middleware';

const router = Router();
const userService = new UserService();

const USERS_CACHE_PREFIX = 'users';

router.get(
  '/',
  authorize(['admin', 'editor']),
  // cacheMiddleware(USERS_CACHE_PREFIX), // Example: cache all users list
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  authorize(['admin', 'editor']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  authorize(['admin']), // Only admin can create users
  validateRequest(CreateUserDto),
  clearCacheMiddleware(USERS_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newUser = await userService.createUser(req.body as CreateUserDto);
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authorize(['admin']), // Only admin can update users
  validateRequest(UpdateUserDto),
  clearCacheMiddleware(USERS_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body as UpdateUserDto);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authorize(['admin']), // Only admin can delete users
  clearCacheMiddleware(USERS_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export const userRouter = router;