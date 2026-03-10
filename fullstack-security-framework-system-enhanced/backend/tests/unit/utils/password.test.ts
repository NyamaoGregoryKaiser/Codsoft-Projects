import * as bcrypt from 'bcryptjs';
import { hashPassword, comparePassword } from '@utils/password';

// Mock bcrypt functions
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('mock_salt')),
  hash: jest.fn(() => Promise.resolve('mock_hashed_password')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

describe('Password Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password with a generated salt', async () => {
      const password = 'mySecretPassword123';
      const hashedPassword = await hashPassword(password);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10); // Default SALT_ROUNDS
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'mock_salt');
      expect(hashedPassword).toBe('mock_hashed_password');
    });
  });

  describe('comparePassword', () => {
    it('should return true if passwords match', async () => {
      const plainPassword = 'mySecretPassword123';
      const hashedPassword = 'mock_hashed_password';

      const match = await comparePassword(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(match).toBe(true);
    });

    it('should return false if passwords do not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Simulate mismatch
      const plainPassword = 'wrongPassword';
      const hashedPassword = 'mock_hashed_password';

      const match = await comparePassword(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(match).toBe(false);
    });
  });
});