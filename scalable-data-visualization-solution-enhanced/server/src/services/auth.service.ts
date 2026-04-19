```typescript
import { AppDataSource } from '../config/db';
import { User, UserRole } from '../models/User';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const authService = {
  /**
   * Registers a new user.
   * @param userData User registration data.
   * @returns Newly created user without password.
   * @throws APIError if username/email already exists or validation fails.
   */
  async register(userData: z.infer<typeof registerSchema>) {
    const validatedData = registerSchema.parse(userData);

    const userRepository = AppDataSource.getRepository(User);

    // Check if user with given email or username already exists
    const existingUser = await userRepository.findOne({
      where: [{ email: validatedData.email }, { username: validatedData.username }],
    });

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        throw new APIError('User with this email already exists', 409);
      }
      if (existingUser.username === validatedData.username) {
        throw new APIError('User with this username already exists', 409);
      }
    }

    const user = userRepository.create(validatedData);
    await user.hashPassword(); // Hash the password
    await userRepository.save(user);

    logger.info(`User registered: ${user.email}`);
    const { password, ...result } = user; // Exclude password from response
    return result;
  },

  /**
   * Authenticates a user and generates JWT tokens.
   * @param credentials User login credentials.
   * @returns Access and refresh tokens.
   * @throws APIError if invalid credentials.
   */
  async login(credentials: z.infer<typeof loginSchema>) {
    const validatedData = loginSchema.parse(credentials);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email: validatedData.email } });

    if (!user || !(await user.comparePassword(validatedData.password))) {
      throw new APIError('Invalid credentials', 401);
    }

    const accessToken = this.generateToken(user.id, config.JWT_SECRET, config.JWT_EXPIRES_IN);
    const refreshToken = this.generateToken(user.id, config.REFRESH_TOKEN_SECRET, config.REFRESH_TOKEN_EXPIRES_IN);

    logger.info(`User logged in: ${user.email}`);
    return { accessToken, refreshToken };
  },

  /**
   * Refreshes an access token using a refresh token.
   * @param tokens Refresh token.
   * @returns New access token.
   * @throws APIError if invalid or expired refresh token.
   */
  async refreshToken(tokens: z.infer<typeof refreshTokenSchema>) {
    const validatedData = refreshTokenSchema.parse(tokens);

    try {
      const decoded = jwt.verify(validatedData.refreshToken, config.REFRESH_TOKEN_SECRET) as { id: string };
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.id } });

      if (!user) {
        throw new APIError('Invalid refresh token: User not found', 401);
      }

      const newAccessToken = this.generateToken(user.id, config.JWT_SECRET, config.JWT_EXPIRES_IN);
      logger.info(`Access token refreshed for user: ${user.email}`);
      return { accessToken: newAccessToken };
    } catch (error: any) {
      logger.error(`Refresh token failed: ${error.message}`, { error });
      throw new APIError('Invalid or expired refresh token', 401);
    }
  },

  /**
   * Generates a JWT token.
   * @param id User ID.
   * @param secret JWT secret.
   * @param expiresIn Token expiration time.
   * @returns JWT token string.
   */
  generateToken(id: string, secret: string, expiresIn: string): string {
    return jwt.sign({ id }, secret, { expiresIn });
  },
};
```