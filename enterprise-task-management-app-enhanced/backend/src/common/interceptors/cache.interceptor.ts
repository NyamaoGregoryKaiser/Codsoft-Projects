import { Injectable, ExecutionContext, CallHandler } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  // Override trackBy to allow granular cache control if needed,
  // e.g., to not cache POST requests or cache based on specific headers
  // For now, it simply uses the default caching logic from NestJS,
  // which caches GET requests by URL + query params.
  protected trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const isGetRequest = request.method === 'GET';

    // Only cache GET requests
    if (!isGetRequest) {
      return undefined;
    }

    // You could add logic here to invalidate cache for certain paths,
    // or include user ID in the cache key for per-user caching if required.
    // For now, it's a simple path-based cache.
    return request.url;
  }
}