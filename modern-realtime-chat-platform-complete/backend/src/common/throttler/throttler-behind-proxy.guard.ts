import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Custom ThrottlerGuard that accounts for requests coming from behind a proxy.
 * It uses the 'X-Forwarded-For' header to determine the client IP.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Request): string {
    // For requests behind a proxy, client IP is typically in 'X-Forwarded-For'
    // This assumes the proxy correctly sets 'X-Forwarded-For' to the client's original IP.
    // Be cautious with this if your proxy setup is not secure, as it can be spoofed.
    // You might also consider 'CF-Connecting-IP' for Cloudflare or similar headers.
    return req.ips.length ? req.ips[0] : req.ip;
  }
}