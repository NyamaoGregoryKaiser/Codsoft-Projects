import { AppDataSource } from '../database';
import { User, UserRole } from '../database/entities/User.entity';
import bcrypt from 'bcryptjs';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { generateAuthTokens } from '../utils/jwt.utils';
import { Cart } from '../database/entities/Cart.entity';
import { logger } from '../config/logger';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private cartRepository = AppDataSource.getRepository(Cart);

  public async register(userData: Pick<User, 'email' | 'password' | 'firstName' | 'lastName'>) {
    const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      role: UserRole.USER, // Default to user role
    });
    await this.userRepository.save(newUser);

    // Create an empty cart for the new user
    const cart = this.cartRepository.create({ user: newUser });
    await this.cartRepository.save(cart);

    logger.info(`User registered: ${newUser.email}`);
    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    };
  }

  public async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect email or password');
    }

    const tokens = generateAuthTokens(user);
    logger.info(`User logged in: ${user.email}`);
    return { user: { id: user.id, email: user.email, role: user.role }, tokens };
  }

  public async refreshTokens(refreshToken: string) {
    // In a real app, you'd verify the refresh token against a database of valid refresh tokens.
    // For simplicity, we'll just re-generate tokens if the refresh token is valid.
    const payload = await verifyToken(refreshToken);

    if (!payload || typeof payload.userId !== 'string') {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.userId } });
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found for refresh token');
    }

    const tokens = generateAuthTokens(user);
    return { user: { id: user.id, email: user.email, role: user.role }, tokens };
  }
}

export const authService = new AuthService();