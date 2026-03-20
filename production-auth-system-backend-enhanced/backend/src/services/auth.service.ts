import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { getDbDataSource } from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpirationDate,
} from '../utils/jwt.utils';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../types/errors';
import logger from '../utils/logger';
import { jwtConfig } from '../config/jwt';

export class AuthService {
  private userRepository: Repository<User>;
  private refreshTokenRepository: Repository<RefreshToken>;

  constructor() {
    this.userRepository = getDbDataSource().getRepository(User);
    this.refreshTokenRepository = getDbDataSource().getRepository(RefreshToken);
  }

  /**
   * Registers a new user.
   * @param email - The user's email.
   * @param password - The user's plain text password.
   * @returns A tuple containing accessToken, refreshToken, and the user object (without password).
   * @throws BadRequestError if user with email already exists.
   */
  async register(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password' | 'refreshTokens'> }> {
    let user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestError('User with this email already exists.');
    }

    user = new User();
    user.email = email;
    user.password = await user.hashPassword(password);
    await this.userRepository.save(user);

    logger.info(`New user registered: ${user.email}`);

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await this.saveRefreshToken(user, newRefreshToken);

    const { password: _, refreshTokens: __, ...userWithoutPassword } = user;
    return { accessToken, refreshToken: newRefreshToken, user: userWithoutPassword };
  }

  /**
   * Logs in a user.
   * @param email - The user's email.
   * @param password - The user's plain text password.
   * @returns A tuple containing accessToken, refreshToken, and the user object (without password).
   * @throws UnauthorizedError if authentication fails.
   */
  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password' | 'refreshTokens'> }> {
    const user = await this.userRepository.findOne({ where: { email }, select: ['id', 'email', 'password', 'role', 'isEmailVerified'] });

    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    logger.info(`User logged in: ${user.email}`);

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await this.saveRefreshToken(user, newRefreshToken); // Save new refresh token, optionally revoke old ones

    const { password: _, refreshTokens: __, ...userWithoutPassword } = user;
    return { accessToken, refreshToken: newRefreshToken, user: userWithoutPassword };
  }

  /**
   * Refreshes access and refresh tokens.
   * Implements refresh token rotation.
   * @param oldRefreshToken - The refresh token provided by the client.
   * @returns A tuple containing new accessToken, new refreshToken, and the user object (without password).
   * @throws UnauthorizedError if the refresh token is invalid, expired, or revoked.
   */
  async refreshTokens(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password' | 'refreshTokens'> }> {
    const decoded = verifyRefreshToken(oldRefreshToken);
    if (!decoded) {
      throw new UnauthorizedError('Invalid refresh token.');
    }

    const storedRefreshToken = await this.refreshTokenRepository.findOne({
      where: { token: oldRefreshToken, userId: decoded.id },
      relations: ['user'],
    });

    if (!storedRefreshToken || storedRefreshToken.isRevoked || storedRefreshToken.expiresAt < new Date()) {
      // If token is found but revoked/expired, or not found, consider it compromised.
      // Optionally, revoke all tokens for this user for increased security.
      if (storedRefreshToken && storedRefreshToken.user) {
         logger.warn(`Compromised refresh token detected for user ${storedRefreshToken.user.email}. Revoking all tokens.`);
         await this.revokeAllUserRefreshTokens(storedRefreshToken.user.id);
      }
      throw new UnauthorizedError('Invalid or expired refresh token. Please login again.');
    }

    // Revoke the old refresh token immediately (token rotation)
    storedRefreshToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedRefreshToken);
    logger.info(`Old refresh token revoked for user ${decoded.email}.`);

    const user = storedRefreshToken.user; // User object from relations
    const payload = { id: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await this.saveRefreshToken(user, newRefreshToken); // Save new refresh token

    const { password: _, refreshTokens: __, ...userWithoutPassword } = user;
    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userWithoutPassword };
  }

  /**
   * Logs out a user by revoking their refresh token.
   * @param refreshToken - The refresh token to revoke.
   * @returns True if the token was revoked, false otherwise.
   * @throws UnauthorizedError if token is invalid.
   */
  async logout(refreshToken: string): Promise<boolean> {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new UnauthorizedError('Invalid refresh token.');
    }

    const storedRefreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, userId: decoded.id },
    });

    if (storedRefreshToken) {
      storedRefreshToken.isRevoked = true;
      await this.refreshTokenRepository.save(storedRefreshToken);
      logger.info(`Refresh token revoked for user ${decoded.email}.`);
      return true;
    }
    logger.warn(`Attempted to logout with non-existent or already revoked token for user ${decoded.email || 'unknown'}.`);
    return false; // Token not found or already revoked
  }

  /**
   * Initiates a password reset process (e.g., send email with reset link/token).
   * For this example, it just logs a "reset token". In a real app, this would involve
   * generating a unique, time-limited token and sending it via email.
   * @param email - The user's email.
   * @returns True if the email was found.
   * @throws NotFoundError if user not found.
   */
  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // For security, it's often better to respond with a generic message
      // even if the user doesn't exist, to prevent email enumeration.
      logger.info(`Forgot password request for non-existent email: ${email}`);
      // return true; // Or throw NotFoundError for direct feedback to user.
      throw new NotFoundError('User not found with this email.');
    }

    // In a real application:
    // 1. Generate a secure, time-limited password reset token.
    // 2. Store this token (e.g., hashed) in the user record or a dedicated table with an expiry.
    // 3. Send an email to `user.email` with a link containing this token.
    const resetToken = 'dummy_reset_token_for_' + user.id + '_' + Date.now(); // Placeholder
    logger.info(`Password reset requested for ${user.email}. Reset token (dev only): ${resetToken}`);
    // Simulate sending email...
    return true;
  }

  /**
   * Resets a user's password using a reset token.
   * For this example, it assumes a simple token verification.
   * In a real app, this would involve verifying the token against the stored one,
   * checking expiry, and then updating the password.
   * @param token - The reset token.
   * @param newPassword - The new plain text password.
   * @returns The updated user object (without password).
   * @throws UnauthorizedError if token is invalid or expired, NotFoundError if user not found.
   */
  async resetPassword(token: string, newPassword: string): Promise<Omit<User, 'password' | 'refreshTokens'>> {
    // In a real application:
    // 1. Verify the 'token' against what was stored (e.g., hash comparison).
    // 2. Check the token's expiry.
    // 3. Find the user associated with the token.
    // For this example, let's mock finding a user via the token (e.g., token might contain user ID or be a direct lookup).
    // Let's assume the token format is 'dummy_reset_token_for_[userId]_[timestamp]'
    const parts = token.split('_');
    if (parts.length < 5 || parts[0] !== 'dummy' || parts[1] !== 'reset' || parts[2] !== 'token' || parts[3] !== 'for') {
      throw new UnauthorizedError('Invalid reset token format.');
    }
    const userId = parts[4];
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User associated with reset token not found.');
    }

    // Simulate token validity (e.g., within 1 hour of creation)
    const tokenTimestamp = parseInt(parts[5], 10);
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - tokenTimestamp > oneHour) {
      throw new UnauthorizedError('Reset token expired.');
    }

    user.password = await user.hashPassword(newPassword);
    await this.userRepository.save(user);
    logger.info(`Password successfully reset for user: ${user.email}`);

    // In a real application, after successful reset, invalidate the reset token to prevent reuse.
    // e.g., user.resetPasswordToken = null; user.resetPasswordExpires = null;

    const { password: _, refreshTokens: __, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Saves a refresh token to the database.
   * @param user - The user associated with the token.
   * @param token - The refresh token string.
   */
  private async saveRefreshToken(user: User, token: string): Promise<void> {
    const expiresAt = getRefreshTokenExpirationDate(jwtConfig.refreshExpiration);
    const refreshTokenEntity = this.refreshTokenRepository.create({
      token,
      user,
      expiresAt,
      isRevoked: false,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);
  }

  /**
   * Revokes all refresh tokens for a given user.
   * Used when a compromised token is detected or on explicit "logout from all devices".
   * @param userId - The ID of the user whose tokens to revoke.
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({ userId }, { isRevoked: true });
    logger.warn(`All refresh tokens revoked for user ID: ${userId}`);
  }
}