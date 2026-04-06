const jwt = require('jsonwebtoken');
const config = require('../../../src/config');
const { generateToken, verifyToken } = require('../../../src/utils/jwt');

// Mock config to ensure consistent secret for tests
jest.mock('../../../src/config', () => ({
    jwt: {
        secret: 'test-secret-key',
        expiresIn: '1h',
    },
}));

describe('JWT Utilities', () => {
    const payload = { userId: 123, username: 'testuser', role: 'user' };

    describe('generateToken', () => {
        it('should generate a valid JWT', () => {
            const token = generateToken(payload);
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);

            // Verify the token using the secret
            const decoded = jwt.verify(token, config.jwt.secret);
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.username).toBe(payload.username);
            expect(decoded.role).toBe(payload.role);
            expect(decoded).toHaveProperty('iat'); // Issued At
            expect(decoded).toHaveProperty('exp'); // Expiration
        });
    });

    describe('verifyToken', () => {
        it('should successfully verify a valid token', () => {
            const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
            const decoded = verifyToken(token);
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.username).toBe(payload.username);
            expect(decoded.role).toBe(payload.role);
        });

        it('should throw an error for an invalid token', () => {
            const invalidToken = 'invalid.jwt.token';
            expect(() => verifyToken(invalidToken)).toThrow(jwt.JsonWebTokenError);
            expect(() => verifyToken(invalidToken)).toThrow('invalid signature');
        });

        it('should throw an error for a malformed token', () => {
            const malformedToken = 'malformed.jwt';
            expect(() => verifyToken(malformedToken)).toThrow(jwt.JsonWebTokenError);
            expect(() => verifyToken(malformedToken)).toThrow('jwt malformed');
        });

        it('should throw an error for an expired token', () => {
            const expiredToken = jwt.sign(payload, config.jwt.secret, { expiresIn: '0s' }); // Create an instantly expired token
            // Wait a tiny bit to ensure it's expired
            return new Promise(resolve => setTimeout(() => {
                expect(() => verifyToken(expiredToken)).toThrow(jwt.TokenExpiredError);
                expect(() => verifyToken(expiredToken)).toThrow('jwt expired');
                resolve();
            }, 10));
        });
    });
});