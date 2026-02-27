```typescript
import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RefreshJwtAuthGuard extends AuthGuard('jwt-refresh') {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      this.logger.warn(`Refresh Token Authentication failed: ${info?.message || err?.message || 'Unknown reason'}`, RefreshJwtAuthGuard.name);

      if (info?.message === 'No auth token' || info?.message === 'jwt malformed') {
        throw err || new UnauthorizedException('Refresh token required');
      }
      if (info?.message === 'jwt expired') {
        throw new UnauthorizedException('Refresh token expired. Please re-login.');
      }
      throw err || new UnauthorizedException('Invalid refresh token');
    }
    return user;
  }
}
```