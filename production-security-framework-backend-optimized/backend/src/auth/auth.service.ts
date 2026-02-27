```typescript
import { Injectable, UnauthorizedException, CACHE_MANAGER, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid'; // For unique refresh token IDs
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: LoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`, AuthService.name);
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return user;
    }

    this.logger.warn(`Failed login attempt for user: ${email}`, AuthService.name);
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, roles: user.roles };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    this.logger.log(`User logged in: ${user.id}`, AuthService.name);
    return {
      user: { id: user.id, email: user.email, roles: user.roles },
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });
    this.logger.log(`New user registered: ${user.id}`, AuthService.name);
    return user;
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const refreshTokenId = uuidv4();
    const payload = { sub: userId, jti: refreshTokenId }; // JTI (JWT ID) for uniqueness and revocation
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    });

    const expiresIn = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME');
    const expiresInSeconds = this.convertTimeToSeconds(expiresIn);

    // Store refresh token in cache for revocation
    await this.cacheManager.set(this.REFRESH_TOKEN_PREFIX + refreshTokenId, userId, { ttl: expiresInSeconds });
    this.logger.debug(`Generated refresh token for user ${userId} with JTI ${refreshTokenId}`, AuthService.name);
    return refreshToken;
  }

  async refreshTokens(userId: string, jti: string, oldRefreshToken: string) {
    const storedUserId = await this.cacheManager.get<string>(this.REFRESH_TOKEN_PREFIX + jti);

    if (!storedUserId || storedUserId !== userId) {
      this.logger.warn(`Invalid or revoked refresh token used by user ${userId} (JTI: ${jti})`, AuthService.name);
      // If a refresh token is reused or invalid, invalidate all refresh tokens for that user
      // This is a common security measure to prevent token replay attacks
      await this.invalidateAllRefreshTokensForUser(userId);
      throw new UnauthorizedException('Invalid or revoked refresh token. Please re-login.');
    }

    // Invalidate the old refresh token
    await this.cacheManager.del(this.REFRESH_TOKEN_PREFIX + jti);
    this.logger.debug(`Revoked old refresh token for user ${userId} (JTI: ${jti})`, AuthService.name);

    // Generate new access and refresh tokens
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return this.login(user);
  }

  async invalidateRefreshToken(jti: string) {
    await this.cacheManager.del(this.REFRESH_TOKEN_PREFIX + jti);
    this.logger.log(`Invalidated refresh token with JTI: ${jti}`, AuthService.name);
  }

  async invalidateAllRefreshTokensForUser(userId: string) {
    const keys: string[] = await this.cacheManager.store.keys(`${this.REFRESH_TOKEN_PREFIX}*`);
    const userRefreshTokens = keys.filter(async key => {
      const storedUserId = await this.cacheManager.get<string>(key);
      return storedUserId === userId;
    });

    if (userRefreshTokens.length > 0) {
      await Promise.all(userRefreshTokens.map(key => this.cacheManager.del(key)));
      this.logger.log(`Invalidated all refresh tokens for user ${userId}`, AuthService.name);
    }
  }

  private convertTimeToSeconds(time: string): number {
    const value = parseInt(time.slice(0, -1));
    const unit = time.slice(-1);
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 0; // Or throw an error
    }
  }
}
```