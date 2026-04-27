import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { WinstonLogger } from '../common/logger/winston.logger';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private readonly logger: WinstonLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from Authorization header as a Bearer token
      ignoreExpiration: false, // Don't ignore token expiration
      secretOrKey: configService.get<string>('JWT_SECRET'), // Secret to sign/verify tokens
    });
    this.logger.setContext('JwtStrategy');
  }

  /**
   * Validates the JWT payload and returns the user.
   * This method is called after the JWT is successfully decoded and verified.
   * @param payload The decoded JWT payload.
   * @returns The user object.
   * @throws UnauthorizedException if the user is not found.
   */
  async validate(payload: JwtPayload) {
    this.logger.debug(`Validating JWT payload for user ID: ${payload.sub}`);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      this.logger.warn(`JWT validation failed: User with ID ${payload.sub} not found.`);
      throw new UnauthorizedException();
    }
    // Return the user object, which will be attached to the request (e.g., req.user)
    // IMPORTANT: Never return the password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    this.logger.debug(`JWT validated successfully for user: ${user.username}`);
    return result;
  }
}