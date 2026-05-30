```javascript
const jwtUtil = require('../../src/utils/jwt.util');
const config = require('../../src/config');
const AppError = require('../../src/utils/appError');
const jwt = require('jsonwebtoken'); // Directly import for mocking

// Mock logger to prevent console spam during tests
jest.mock('../../src/config/logger.config', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('jwt.util', () => {
  const payload = { id: 'testUserId', role: 'user' };
  const secret = config.jwt.secret;
  const expiresIn = config.jwt.expiresIn;

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = jwtUtil.generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const decoded = jwt.verify(token, secret);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw AppError if token generation fails (e.g., bad secret)', () => {
      const originalSecret = config.jwt.secret;
      config.jwt.secret = null; // Simulate a bad secret

      expect(() => jwtUtil.generateToken(payload)).toThrow(AppError);
      expect(() => jwtUtil.generateToken(payload)).toThrow('Failed to generate token');

      config.jwt.secret = originalSecret; // Restore original secret
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify a valid token', () => {
      const token = jwt.sign(payload, secret, { expiresIn });
      const decoded = jwtUtil.verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw AppError for an invalid token', () => {
      const invalidToken = 'invalid.jwt.token';
      expect(() => jwtUtil.verifyToken(invalidToken)).toThrow(AppError);
      expect(() => jwtUtil.verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw AppError for an expired token', () => {
      const expiredToken = jwt.sign(payload, secret, { expiresIn: '1s' });
      // Wait for the token to expire
      return new Promise((resolve) => setTimeout(() => {
        expect(() => jwtUtil.verifyToken(expiredToken)).toThrow(AppError);
        expect(() => jwtUtil.verifyToken(expiredToken)).toThrow('Invalid or expired token');
        resolve();
      }, 1100)); // Wait a bit more than 1 second
    });
  });
});
```