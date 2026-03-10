import { Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '@models/prisma';
import { signJwt, verifyJwt } from '@utils/jwt';
import { AppError } from '@utils/appError';
import { AuthMessages } from '@constants/messages';
import { env } from '@config/env';
import { User } from '@prisma/client';

/**
 * Generate access and refresh tokens
 * @param {string} userId
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export const generateAuthTokens = async (userId: string) => {
  const accessToken = signJwt(userId, env.jwtAccessExpirationMinutes, 'access');
  const refreshToken = signJwt(userId, env.jwtRefreshExpirationDays, 'refresh');

  // Save refresh token to database for revocation
  await prisma.token.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + env.jwtRefreshExpirationDays * 24 * 60 * 60 * 1000), // days to ms
      type: 'REFRESH',
    },
  });

  return { accessToken, refreshToken };
};

/**
 * Generate reset password token
 * @param {string} userId
 * @returns {Promise<string>}
 */
export const generateResetPasswordToken = async (userId: string) => {
  const resetToken = signJwt(userId, 10, 'resetPassword'); // 10 minutes for reset password token

  // Store reset token temporarily (e.g., in DB with a short expiry)
  await prisma.token.create({
    data: {
      userId,
      token: resetToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      type: 'RESET_PASSWORD',
    },
  });

  return resetToken;
};

/**
 * Verify reset password token and return user ID if valid
 * @param {string} token
 * @returns {Promise<string | null>} userId
 */
export const verifyResetPasswordToken = async (token: string) => {
  try {
    const payload = verifyJwt(token);
    if (!payload || payload.type !== 'resetPassword') {
      return null;
    }

    const dbToken = await prisma.token.findFirst({
      where: {
        userId: payload.sub,
        token: token,
        type: 'RESET_PASSWORD',
        expiresAt: { gt: new Date() }, // Check if token is not expired
      },
    });

    if (!dbToken) {
      return null;
    }

    // Invalidate the reset token after successful verification
    await prisma.token.delete({ where: { id: dbToken.id } });

    return payload.sub;
  } catch (error) {
    return null;
  }
};


/**
 * Refresh access and refresh tokens
 * @param {string} oldRefreshToken
 * @returns {Promise<{newAccessToken: string, newRefreshToken: string, user: User}>}
 */
export const refreshTokens = async (oldRefreshToken: string) => {
  const payload = verifyJwt(oldRefreshToken);
  if (!payload || payload.type !== 'refresh') {
    throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.REFRESH_TOKEN_INVALID);
  }

  const existingToken = await prisma.token.findFirst({
    where: {
      userId: payload.sub,
      token: oldRefreshToken,
      type: 'REFRESH',
      expiresAt: { gt: new Date() }, // Check if token is not expired
    },
  });

  if (!existingToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.REFRESH_TOKEN_INVALID);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.USER_NOT_FOUND);
  }

  // Invalidate the old refresh token
  await prisma.token.delete({ where: { id: existingToken.id } });

  // Generate new tokens
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAuthTokens(user.id);

  return { newAccessToken, newRefreshToken, user };
};

/**
 * Delete a refresh token from the database.
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export const deleteRefreshToken = async (refreshToken: string) => {
  try {
    const payload = verifyJwt(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      return; // Token is invalid or not a refresh token, nothing to delete.
    }

    await prisma.token.deleteMany({
      where: {
        userId: payload.sub,
        token: refreshToken,
        type: 'REFRESH',
      },
    });
  } catch (error) {
    // If token is malformed or expired, verifyJwt will throw, just ignore and proceed
    return;
  }
};


/**
 * Set authentication cookies in the response
 * @param {Response} res
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const accessExpiry = new Date(Date.now() + env.jwtAccessExpirationMinutes * 60 * 1000);
  const refreshExpiry = new Date(Date.now() + env.jwtRefreshExpirationDays * 24 * 60 * 60 * 1000);

  res.cookie(env.jwtCookieNameAccess, accessToken, {
    httpOnly: true,
    secure: env.isProduction, // Use secure cookies in production
    sameSite: 'lax', // CSRF protection
    expires: accessExpiry,
  });

  res.cookie(env.jwtCookieNameRefresh, refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    expires: refreshExpiry,
  });
};

/**
 * Clear authentication cookies from the response
 * @param {Response} res
 */
export const clearAuthCookies = (res: Response) => {
  res.clearCookie(env.jwtCookieNameAccess, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
  });
  res.clearCookie(env.jwtCookieNameRefresh, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
  });
};