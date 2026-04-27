import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { WinstonLogger } from '../common/logger/winston.logger';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: WinstonLogger) {
    super();
    this.logger.setContext('JwtAuthGuard');
  }

  /**
   * CanActivate method for the guard.
   * @param context The execution context (HTTP or WebSocket).
   * @returns A boolean indicating if the request is authorized, or a Promise/Observable resolving to a boolean.
   * @throws UnauthorizedException if authentication fails.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Add your custom authentication logic here
    // For example, check if the user has a specific role or permission
    // For HTTP requests, the default AuthGuard logic handles JWT validation
    // For WebSockets, you might need custom logic to extract token from handshake
    this.logger.debug('Attempting to activate JwtAuthGuard');
    return super.canActivate(context);
  }

  /**
   * Handles authentication failure.
   * @param err The error thrown during authentication.
   * @param user The user object (if authentication was partially successful).
   * @param info Additional information from the strategy.
   * @returns The user object if authentication was successful.
   * @throws UnauthorizedException if authentication fails.
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${info?.message || err?.message || 'Unknown reason'}`);
      throw err || new UnauthorizedException();
    }
    this.logger.debug(`User ${user.username} successfully authenticated via JWT.`);
    return user;
  }
}