```typescript
import { Request, Response, NextFunction } from 'express';
import { rateLimitMiddleware } from '../../src/middleware/rateLimit';
import { APIError } from '../../src/utils/error';

// Mock logger to suppress console output during tests
jest.mock('../../src/utils/logger');

// Temporarily modify the constants for testing purposes
const originalMaxRequests = 100;
const originalWindowMs = 60 * 1000;
(rateLimitMiddleware as any).MAX_REQUESTS = 5; // Allow 5 requests per test window
(rateLimitMiddleware as any).WINDOW_MS = 1000; // 1 second window

describe('Rate Limit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();

    // Clear the internal requestCounts map before each test
    (rateLimitMiddleware as any).requestCounts.clear();
  });

  afterAll(() => {
    // Restore original constants after all tests
    (rateLimitMiddleware as any).MAX_REQUESTS = originalMaxRequests;
    (rateLimitMiddleware as any).WINDOW_MS = originalWindowMs;
  });

  it('should call next for requests within the limit', () => {
    for (let i = 0; i < (rateLimitMiddleware as any).MAX_REQUESTS; i++) {
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(i + 1);
      expect(mockNext).toHaveBeenLastCalledWith();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', (rateLimitMiddleware as any).MAX_REQUESTS);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', (rateLimitMiddleware as any).MAX_REQUESTS - (i + 1));
    }
  });

  it('should call next with APIError 429 when limit is exceeded', () => {
    for (let i = 0; i < (rateLimitMiddleware as any).MAX_REQUESTS; i++) {
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    }

    // This request should exceed the limit
    rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes((rateLimitMiddleware as any).MAX_REQUESTS + 1);
    expect(mockNext).toHaveBeenLastCalledWith(expect.any(APIError));
    expect((mockNext as jest.Mock).mock.calls.pop()[0].statusCode).toBe(429);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
  });

  it('should reset the count after the windowMs has passed', (done) => {
    for (let i = 0; i < (rateLimitMiddleware as any).MAX_REQUESTS; i++) {
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    }
    expect(mockNext).toHaveBeenCalledTimes((rateLimitMiddleware as any).MAX_REQUESTS);

    setTimeout(() => {
      // After the window, the count should reset
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes((rateLimitMiddleware as any).MAX_REQUESTS + 1);
      expect(mockNext).toHaveBeenLastCalledWith(); // No error, as count reset
      done();
    }, (rateLimitMiddleware as any).WINDOW_MS + 50); // A small buffer after the window
  });

  it('should handle different IP addresses independently', () => {
    mockRequest.ip = '192.168.1.1';
    rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenLastCalledWith();

    mockRequest.ip = '192.168.1.2'; // New IP
    rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenLastCalledWith();

    // The first IP should still have its count
    mockRequest.ip = '192.168.1.1';
    rateLimitMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(3);
    expect(mockNext).toHaveBeenLastCalledWith();
  });
});
```