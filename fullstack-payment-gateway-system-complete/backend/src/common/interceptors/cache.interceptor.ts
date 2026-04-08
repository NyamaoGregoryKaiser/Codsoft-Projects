import { CacheInterceptor, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  protected get,Key(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const { user, originalUrl } = request;

    // If user is authenticated and has a merchantId, make cache key merchant-specific
    if (user && user.merchantId) {
      return `${user.merchantId}:${originalUrl}`;
    }
    // Otherwise, use the default URL-based key
    return originalUrl;
  }
}