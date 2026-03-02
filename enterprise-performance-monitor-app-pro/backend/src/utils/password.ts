import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateApiKey = (): string => {
    // Generate a secure random string for the API key
    // Using UUID v4 for simplicity, but a longer, more random string is also good.
    // For a real production system, consider a library like `crypto-random-string`.
    const { v4: uuidv4 } = require('uuid'); // Using require for dynamic import example
    return uuidv4();
};