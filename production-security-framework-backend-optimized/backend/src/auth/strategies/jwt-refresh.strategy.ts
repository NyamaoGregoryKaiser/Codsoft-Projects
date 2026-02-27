```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const refreshTokenCookieName = configService.get<string>('JWT_REFRESH_TOKEN_COOKIE_NAME');
        const refreshToken = req.cookies?.[refreshTokenCookieName];
        if (!refreshToken) {
          throw new UnauthorizedException('No refresh token found in cookies');
        }
        return refreshToken;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true, // Pass the request object to the validate method
    });
  }

  async validate(req: Request, payload: any) {
    // Check if the user exists
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or refresh token invalid');
    }

    // Attach JTI and the refresh token value itself to the user object
    // This allows the Auth service to invalidate the specific refresh token
    // And to compare the actual token value for rotation
    const refreshTokenCookieName = this.configService.get<string>('JWT_REFRESH_TOKEN_COOKIE_NAME');
    const refreshToken = req.cookies?.[refreshTokenCookieName];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing from cookie');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return { ...result, jti: payload.jti, refreshToken };
  }
}
```