```typescript
import { Injectable, UnauthorizedException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // For example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on the "info" object or error message
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${info?.message || err?.message || 'Unknown reason'}`, JwtAuthGuard.name);
      // 'info' can contain details like 'jwt expired', 'no auth token', etc.
      // 'err' would be for something like token malformed (if passport-jwt throws an error)

      // Distinguish between unauthorized (no token, bad token) and forbidden (token valid but no permission)
      if (info?.message === 'No auth token' || info?.message === 'jwt malformed') {
        throw err || new UnauthorizedException('Authentication required');
      }
      if (info?.message === 'jwt expired') {
        throw new UnauthorizedException('Access token expired. Please refresh.');
      }
      // If user is null but no specific info/error, it's typically unauthorized
      throw err || new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
```