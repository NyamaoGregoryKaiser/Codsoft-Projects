import { generateToken, verifyToken } from '../../../src/utils/jwt';
import config from '../../../src/config';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../../src/modules/users/user.entity';

// Mock config to control JWT secret and expiration during tests
jest.mock('../../../src/config', () => ({
  jwt: {
    secret: 'test-secret',
    expiresIn: '1s', // Short expiry for testing
  },
}));

describe('JWT Utilities', () => {
  const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  const userRole = UserRole.MEMBER;

  it('should generate a valid JWT token', () => {
    const token = generateToken(userId, userRole);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should verify a valid JWT token', () => {
    const token = generateToken(userId, userRole);
    const decoded = verifyToken(token);
    expect(decoded).toEqual({ userId, role: userRole, iat: expect.any(Number), exp: expect.any(Number) });
  });

  it('should throw an error for an invalid token', () => {
    expect(() => verifyToken('invalid.token.string')).toThrow(jwt.JsonWebTokenError);
  });

  it('should throw an error for a malformed token', () => {
    expect(() => verifyToken('malformed_token')).toThrow(jwt.JsonWebTokenError);
  });

  it('should throw an error for an expired token', async () => {
    const expiredToken = jwt.sign({ userId, role: userRole }, config.jwt.secret, { expiresIn: '0s' });
    // Wait for a tiny bit to ensure it's expired
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(() => verifyToken(expiredToken)).toThrow(jwt.TokenExpiredError);
  });
});