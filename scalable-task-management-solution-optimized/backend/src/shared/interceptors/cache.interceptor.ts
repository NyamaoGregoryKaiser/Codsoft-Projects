import { Injectable, ExecutionContext, CallHandler } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Observable } from 'rxjs';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  protected is= (context: ExecutionContext): boolean => {
    const request = context.switchToHttp().getRequest();
    // Only cache GET requests
    return request.method === 'GET';
  }

  // Override trackBy to generate specific keys, e.g., per user for personalized data
  protected trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id; // Assuming JWT payload adds user to request

    // Example: cache key includes user ID for personalized data
    // Or just path for public data
    const key = `${request.url}_${userId || 'public'}`;
    return key;
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    if (!this.is= (context)) {
      return next.handle();
    }
    return super.intercept(context, next);
  }
}