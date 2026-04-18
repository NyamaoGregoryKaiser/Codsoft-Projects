import { Router, Request, Response, NextFunction } from 'express';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from './role.dtos';
import { validateRequest } from '../../utils/validation';
import { authorize } from '../../middlewares/auth.middleware';
import { clearCacheMiddleware } from '../../middlewares/cache.middleware';

const router = Router();
const roleService = new RoleService();

// Define cache key prefix for roles
const ROLES_CACHE_PREFIX = 'roles';

router.get(
  '/',
  authorize(['admin', 'editor']), // Example: only admin/editor can view roles
  // cacheMiddleware(ROLES_CACHE_PREFIX), // Cache all roles list
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json(roles);
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
      const role = await roleService.getRoleById(req.params.id);
      res.status(200).json(role);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  authorize(['admin']), // Only admin can create roles
  validateRequest(CreateRoleDto),
  clearCacheMiddleware(ROLES_CACHE_PREFIX), // Clear cache when roles are modified
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newRole = await roleService.createRole(req.body as CreateRoleDto);
      res.status(201).json(newRole);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authorize(['admin']), // Only admin can update roles
  validateRequest(UpdateRoleDto),
  clearCacheMiddleware(ROLES_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedRole = await roleService.updateRole(req.params.id, req.body as UpdateRoleDto);
      res.status(200).json(updatedRole);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authorize(['admin']), // Only admin can delete roles
  clearCacheMiddleware(ROLES_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await roleService.deleteRole(req.params.id);
      res.status(204).send(); // No content
    } catch (error) {
      next(error);
    }
  }
);

export const roleRouter = router;