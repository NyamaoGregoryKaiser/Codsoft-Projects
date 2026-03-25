```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get<T>(key: string, defaultValue?: T): T {
    return this.nestConfigService.get<T>(key, defaultValue);
  }

  get databaseUrl(): string {
    return this.get<string>('DATABASE_URL', 'postgresql://user:password@localhost:5432/chat_app');
  }

  get jwtSecret(): string {
    return this.get<string>('JWT_SECRET', 'superSecretDefaultKey');
  }

  get jwtExpirationTime(): string {
    return this.get<string>('JWT_EXPIRATION_TIME', '3600s'); // 1 hour
  }

  get redisHost(): string {
    return this.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.get<number>('REDIS_PORT', 6379);
  }

  get redisPassword(): string {
    return this.get<string>('REDIS_PASSWORD', '');
  }

  get apiRateLimitTTL(): number {
    return this.get<number>('API_RATE_LIMIT_TTL', 60); // seconds
  }

  get apiRateLimitMax(): number {
    return this.get<number>('API_RATE_LIMIT_MAX', 100); // requests
  }

  get port(): number {
    return this.get<number>('PORT', 3000);
  }
}
```