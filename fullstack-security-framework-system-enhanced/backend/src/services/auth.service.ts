import httpStatus from 'http-status';
import { prisma } from '@models/prisma';
import { hashPassword, comparePassword } from '@utils/password';
import { AppError } from '@utils/appError';
import * as tokenService from './token.service';
import * as emailService from './email.service';
import { AuthMessages } from '@constants/messages';
import { env } from '@config/env';

/**
 * Register a new user
 * @param {object} userBody
 * @returns {Promise<User>}
 */
export const registerUser = async (userBody: any) => {
  if (await prisma.user.isEmailTaken(userBody.email)) {
    throw new AppError(httpStatus.CONFLICT, AuthMessages.EMAIL_ALREADY_EXISTS);
  }
  const hashedPassword = await hashPassword(userBody.password);
  const user = await prisma.user.create({
    data: {
      ...userBody,
      password: hashedPassword,
    },
  });
  return user;
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>}
 */
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.INVALID_CREDENTIALS);
  }
  const { accessToken, refreshToken } = await tokenService.generateAuthTokens(user.id);
  return { user, accessToken, refreshToken };
};

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Prevent email enumeration by always returning success, but don't send email
    return;
  }
  const resetToken = await tokenService.generateResetPasswordToken(user.id);
  const resetUrl = `${env.resetPasswordUrl}?token=${resetToken}`;

  // In a real app, send email here. For demo, log to console.
  emailService.sendResetPasswordEmail(user.email, resetUrl);
};

/**
 * Reset password
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const resetUserPassword = async (token: string, newPassword: string) => {
  const userId = await tokenService.verifyResetPasswordToken(token);
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.TOKEN_INVALID);
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Invalidate all tokens for this user for security after password change
  await prisma.token.deleteMany({
    where: { userId },
  });
};