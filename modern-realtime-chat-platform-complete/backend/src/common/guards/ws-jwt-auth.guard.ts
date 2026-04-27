import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { UsersService } from '../../users/users.service';
import { WinstonLogger } from '../logger/winston.logger';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import * as cookie from 'cookie'; // To parse cookies from handshake

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private readonly logger: WinstonLogger,
  ) {
    this.logger.setContext('WsJwtAuthGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const accessToken = this.extractTokenFromSocket(client);

    if (!accessToken) {
      this.logger.warn(`WS Auth failed for client ${client.id}: No token provided`);
      throw new WsException('Unauthorized: No access token');
    }

    try {
      const payload: JwtPayload = this.jwtService.verify(accessToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user to the socket for later use in gateway handlers
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        this.logger.warn(`WS Auth failed for client ${client.id}: User ${payload.sub} not found`);
        throw new WsException('Unauthorized: User not found');
      }

      // Important: Add the user object to the socket for subsequent message handlers
      // The `client` object is available throughout the WebSocket connection lifecycle
      (client as any).user = user;
      this.logger.debug(`Client ${client.id} authenticated successfully via WS JWT. User: ${user.username}`);
      return true;
    } catch (error) {
      this.logger.error(`WS Auth failed for client ${client.id}: ${error.message}`, error.stack);
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  /**
   * Extracts the JWT token from various places in the WebSocket handshake.
   * Prioritize `Bearer` header, then query parameter, then cookie.
   */
  private extractTokenFromSocket(client: Socket): string | undefined {
    // 1. Check Authorization header (preferred)
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7, authHeader.length);
    }

    // 2. Check query parameters (less secure, but common for WS)
    const tokenFromQuery = client.handshake.query.token as string;
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    // 3. Check cookies (if you're using cookie-based auth alongside JWT)
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const parsedCookies = cookie.parse(cookies);
      const tokenFromCookie = parsedCookies['jwt_token']; // Example cookie name
      if (tokenFromCookie) {
        return tokenFromCookie;
      }
    }

    return undefined;
  }
}