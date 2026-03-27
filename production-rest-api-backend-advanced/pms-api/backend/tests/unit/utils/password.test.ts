import { hashPassword, comparePassword } from '../../../src/utils/password';

describe('Password Utilities', () => {
  const plainPassword = 'mySecurePassword123';

  it('should hash a password', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    expect(typeof hashedPassword).toBe('string');
    expect(hashedPassword.length).toBeGreaterThan(0);
    expect(hashedPassword).not.toBe(plainPassword); // Should not be plain text
  });

  it('should correctly compare a plain password with its hash', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    const isMatch = await comparePassword(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it('should return false for incorrect passwords', async () => {
    const hashedPassword = await hashPassword(plainPassword);
    const isMatch = await comparePassword('wrongPassword', hashedPassword);
    expect(isMatch).toBe(false);
  });

  it('should return false if hash is invalid format', async () => {
    const isMatch = await comparePassword(plainPassword, 'invalidHash');
    expect(isMatch).toBe(false);
  });
});