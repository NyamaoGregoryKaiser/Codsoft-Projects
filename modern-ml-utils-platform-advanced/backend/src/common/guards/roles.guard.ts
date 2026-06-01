```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles specified, access granted
    }

    const { user } = context.switchToHttp().getRequest<{ user: User }>();

    if (!user) {
      throw new ForbiddenException('You do not have permission to access this resource.'); // Should be caught by JwtAuthGuard first for Unauthorized
    }

    const hasPermission = requiredRoles.some((role) => user.role === role);

    // Additionally check if the user is trying to access/modify their own resource
    // This is a common pattern for "owner access"
    const request = context.switchToHttp().getRequest();
    const userId = request.params.id; // Assuming user ID is in URL params

    if (!hasPermission && userId && user.id === userId) {
      // Allow user to access/modify their own resource even if they don't have the specific role
      // This is for endpoints like /users/:id GET, PATCH, DELETE where a user can operate on their own account.
      // For sensitive operations (e.g., changing roles), explicit admin role is still needed.
      return true;
    }

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }
}
```