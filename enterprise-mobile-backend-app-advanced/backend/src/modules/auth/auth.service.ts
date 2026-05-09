import { User, UserRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/database';
import { ApiError } from '../../middleware/error.middleware';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateToken, verifyToken } from '../../utils/jwt';
import config from '../../config/env';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user.
 * @param email
 * @param password
 * @param name
 * @returns {User}
 */
export const registerUser = async (email: string, password: string, name: string): Promise<User> => {
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already registered');
  }
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: UserRole.USER, // Default role
    },
  });
  return user;
};

/**
 * Log in a user and generate JWT tokens.
 * @param email
 * @param password
 * @returns {AuthTokens}
 */
export const loginUser = async (email: string, password: string): Promise<AuthTokens> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect email or password');
  }

  const accessToken = generateToken(user.id, user.email, user.role, 'access');
  const refreshToken = generateToken(user.id, user.email, user.role, 'refresh');

  // Save refresh token to database
  await prisma.token.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + config.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

/**
 * Refresh access token using a refresh token.
 * @param oldRefreshToken
 * @returns {AuthTokens}
 */
export const refreshAuthTokens = async (oldRefreshToken: string): Promise<AuthTokens> => {
  const decoded = verifyToken(oldRefreshToken);

  if (!decoded || decoded.type !== 'refresh') {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const storedToken = await prisma.token.findUnique({
    where: { token: oldRefreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date() || !storedToken.user) {
    // If token is invalid or expired, delete it and associated user sessions
    if (storedToken) {
      await prisma.token.delete({ where: { id: storedToken.id } });
    }
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired or invalid');
  }

  // Delete the old refresh token
  await prisma.token.delete({ where: { id: storedToken.id } });

  const newAccessToken = generateToken(
    storedToken.user.id,
    storedToken.user.email,
    storedToken.user.role,
    'access'
  );
  const newRefreshToken = generateToken(
    storedToken.user.id,
    storedToken.user.email,
    storedToken.user.role,
    'refresh'
  );

  // Save the new refresh token
  await prisma.token.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.user.id,
      expiresAt: new Date(Date.now() + config.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout a user by deleting their refresh token.
 * @param refreshToken
 * @returns {void}
 */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  const storedToken = await prisma.token.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Refresh token not found');
  }

  await prisma.token.delete({ where: { id: storedToken.id } });
};