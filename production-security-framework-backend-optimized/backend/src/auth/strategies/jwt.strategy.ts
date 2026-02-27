```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extract JWT from Authorization header (Bearer token)
          // This is primarily for Swagger/Postman testing.
          // For actual web app, frontend will generally not set this for access token
          // as it's meant to be in a cookie.
          const authHeader = request.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
          }
          // The access token for a production web client should come from a http-only cookie,
          // but for this example, we're putting it in the header for easier testing with Swagger/Postman.
          // For a true http-only cookie scenario for access tokens, the backend would typically
          // read the cookie directly without `ExtractJwt` or use a custom extractor.
          // For this example, we'll assume access token is in header OR cookie (for consistency in testing).
          // For full security, access token *should* be in an http-only cookie.
          // Let's modify: Access token is expected in 'Authorization' header. Refresh token in http-only cookie.
          // So, for access token, we primarily look at header for convenience and security considerations (XSS vs CSRF trade-off).
          // If the access token was also in an http-only cookie, we'd extract it from there.
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: any) {
    // Validate the user associated with the JWT payload
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or token invalid.');
    }
    // Return user with sensitive data (like password) removed
    // The `req.user` object will contain this
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
```