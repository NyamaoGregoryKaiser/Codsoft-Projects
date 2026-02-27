```typescript
import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { email } = request.body; // Extract email from request body for logging

    if (err || !user) {
      this.logger.warn(`Local authentication failed for email: ${email}. Info: ${info?.message || err?.message || 'Unknown reason'}`, LocalAuthGuard.name);
      throw err || new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`Local authentication successful for email: ${email}. User ID: ${user.id}`, LocalAuthGuard.name);
    return user;
  }
}
```