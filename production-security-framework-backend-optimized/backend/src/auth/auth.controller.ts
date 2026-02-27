```typescript
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RefreshJwtAuthGuard } from '../common/guards/refresh-jwt-auth.guard';
import { ApiBody, ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import * as rateLimit from 'express-rate-limit';
import { applyDecorators } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

// Decorator for applying rate limits to critical auth endpoints
function RateLimited(max: number = 10, windowMs: number = 15 * 60 * 1000) {
  const limiter = rateLimit({
    windowMs,
    max,
    message: `Too many requests, please try again after ${windowMs / 60000} minutes.`,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    applyDecorators(UseGuards(limiter as any))(target, key, descriptor); // Cast to any because UseGuards expects a class or guard interface
  };
}


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly refreshTokenCookieName: string;
  private readonly refreshTokenExpirationTime: string;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.refreshTokenCookieName = this.configService.get<string>('JWT_REFRESH_TOKEN_COOKIE_NAME');
    this.refreshTokenExpirationTime = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME');
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully registered.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input.' })
  @RateLimited(5, 15 * 60 * 1000) // 5 registrations per 15 minutes
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: 'User registered successfully. Please login.',
      user: { id: user.id, email: user.email, roles: user.roles },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user and get JWT tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged in.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials.' })
  @UseGuards(LocalAuthGuard) // This guard calls validateUser in AuthService
  @RateLimited(10, 15 * 60 * 1000) // 10 login attempts per 15 minutes
  async login(@Req() req: Request & { user: User }, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.login(req.user);

    this.setRefreshTokenCookie(res, refreshToken);

    this.logger.log(`User ${user.id} successfully logged in.`, AuthController.name);

    return { user, accessToken }; // Access token in response body, refresh token in cookie
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'New access token granted.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired refresh token.' })
  @UseGuards(RefreshJwtAuthGuard)
  async refreshTokens(@Req() req: Request & { user: User & { jti: string; refreshToken: string } }, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.refreshTokens(
      req.user.id,
      req.user.jti,
      req.user.refreshToken // Pass the old refresh token value
    );

    this.setRefreshTokenCookie(res, refreshToken);

    this.logger.log(`User ${user.id} successfully refreshed tokens.`, AuthController.name);

    return { user, accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Log out a user and invalidate refresh token' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User successfully logged out.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logged out but no token to invalidate.' })
  @UseGuards(RefreshJwtAuthGuard) // Use refresh guard to get user and JTI from refresh token
  async logout(@Req() req: Request & { user: User & { jti: string } }, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies[this.refreshTokenCookieName];

    if (refreshToken && req.user?.jti) {
      await this.authService.invalidateRefreshToken(req.user.jti);
      this.logger.log(`User ${req.user.id} logged out. Refresh token JTI ${req.user.jti} invalidated.`, AuthController.name);
    } else {
      this.logger.log(`Logout request received, but no valid refresh token or JTI found in cookie.`, AuthController.name);
    }

    // Clear the refresh token cookie
    res.clearCookie(this.refreshTokenCookieName, { httpOnly: true, secure: true, sameSite: 'lax' });

    return; // 204 No Content
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const refreshTokenExpirationTimeInMs = this.convertTimeToMs(this.refreshTokenExpirationTime);
    res.cookie(this.refreshTokenCookieName, refreshToken, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax', // Protection against CSRF attacks
      expires: new Date(Date.now() + refreshTokenExpirationTimeInMs),
      path: '/auth/refresh', // Restrict cookie to specific path for refresh token
    });
  }

  private convertTimeToMs(time: string): number {
    const value = parseInt(time.slice(0, -1));
    const unit = time.slice(-1);
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 3600 * 1000;
      case 'd': return value * 86400 * 1000;
      default: return 0; // Or throw an error
    }
  }
}
```